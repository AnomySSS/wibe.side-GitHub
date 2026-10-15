import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Bike,
  Music,
  Coffee,
  Gamepad2,
  Compass,
  BookOpen,
  Heart,
  Users,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
  Crosshair,
  Filter,
  Eye,
  Landmark,
  Sparkles,
  Building2,
  ExternalLink,
  X,
  MapPin,
  PlusCircle,
  Mountain,
  Film,
} from 'lucide-react';
import {
  MeetupEvent,
  EventCategory,
  CATEGORY_MAP,
  getDensityColor,
  calculateEventRating,
  getRatingBadgeColor,
  getDistanceMeters,
} from '../types';
import { SmsRadar5Km } from './SmsRadar5Km';
import { OPEN_DATA_PLACES, OpenDataPlace, OpenDataCategory } from '../data/openDataPlaces';
import { NavigationHud } from './NavigationHud';
import {
  RouteDestination,
  RouteResult,
  RouteMode,
  calculateRoute,
} from '../utils/routing';

interface InteractiveRegionMapProps {
  events: MeetupEvent[];
  selectedCategory: EventCategory | 'all';
  onSelectCategory: (cat: EventCategory | 'all') => void;
  onSelectEvent: (event: MeetupEvent) => void;
  onToggleLike: (eventId: string) => void;
  userGps: { lat: number; lng: number; label: string };
  onUpdateUserGps: (lat: number, lng: number, label: string) => void;
  onRequestRealGps: () => void;
  onEmptyMapClick?: () => void;
  userPhone?: string;
  onUpdatePhone?: (phone: string) => void;
  isRegistered?: boolean;
  onRequireRegistration?: (reason: 'like' | 'sms') => void;
  onCreateEventAtPlace?: (place: OpenDataPlace) => void;
  activeNavigationDestination?: RouteDestination | null;
  onClearNavigation?: () => void;
}

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  events: MeetupEvent[];
  densityCount: number;
  colorHex: string;
  colorRgb: [number, number, number];
  radiusMeters: number;
}

export const CategoryIcon: React.FC<{ category: EventCategory; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'sport':
      return <Bike className={className} />;
    case 'party':
      return <Music className={className} />;
    case 'kava':
      return <Coffee className={className} />;
    case 'deskovky':
      return <Gamepad2 className={className} />;
    case 'prochazky':
      return <Compass className={className} />;
    case 'kultura':
      return <BookOpen className={className} />;
  }
};

export const getOpenDataIcon = (category: OpenDataCategory, className = 'w-3.5 h-3.5') => {
  switch (category) {
    case 'knihovna':
      return <BookOpen className={className} />;
    case 'muzeum':
      return <Landmark className={className} />;
    case 'turistika':
      return <Compass className={className} />;
    case 'hriste':
      return <Sparkles className={className} />;
    case 'kulturak':
      return <Building2 className={className} />;
    case 'priroda':
      return <Mountain className={className} />;
    case 'kino':
      return <Film className={className} />;
  }
};

export const getOpenDataCategoryLabel = (category: OpenDataCategory) => {
  switch (category) {
    case 'knihovna':
      return 'Knihovna';
    case 'muzeum':
      return 'Muzeum & Galerie';
    case 'turistika':
      return 'Turistický cíl';
    case 'hriste':
      return 'Hřiště & Park';
    case 'kulturak':
      return 'Kulturní dům & Centrum';
    case 'priroda':
      return 'Příroda & Hory';
    case 'kino':
      return 'Kino & Film';
  }
};

export const getOpenDataColor = (category: OpenDataCategory): string => {
  switch (category) {
    case 'priroda':
      return '#10b981'; // Emerald
    case 'kino':
      return '#8b5cf6'; // Violet
    case 'kulturak':
      return '#f59e0b'; // Amber
    case 'knihovna':
      return '#38bdf8'; // Sky
    case 'muzeum':
      return '#fb7185'; // Rose
    case 'turistika':
      return '#2dd4bf'; // Teal
    case 'hriste':
      return '#a3e635'; // Lime
    default:
      return '#94a3b8';
  }
};

const metersToPixels = (meters: number, lat: number, currentZoom: number) => {
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, currentZoom);
  return meters / metersPerPixel;
};

export const InteractiveRegionMap: React.FC<InteractiveRegionMapProps> = ({
  events,
  selectedCategory,
  onSelectCategory,
  onSelectEvent,
  onToggleLike,
  userGps,
  onUpdateUserGps,
  onRequestRealGps,
  onEmptyMapClick,
  userPhone = '+420 732 418 902',
  onUpdatePhone,
  isRegistered,
  onRequireRegistration,
  onCreateEventAtPlace,
  activeNavigationDestination,
  onClearNavigation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const [zoom, setZoom] = useState<number>(14);
  const [panTick, setPanTick] = useState<number>(0);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showGpsDrawer, setShowGpsDrawer] = useState<boolean>(false);
  const [showOpenDataPlaces, setShowOpenDataPlaces] = useState<boolean>(true);
  const [selectedOpenDataPlace, setSelectedOpenDataPlace] = useState<OpenDataPlace | null>(null);
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<OpenDataCategory | 'all'>('all');
  const [hoveredOpenDataId, setHoveredOpenDataId] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Active Navigation Target & Calculated Route
  const [activeRouteTarget, setActiveRouteTarget] = useState<RouteDestination | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('walking');

  const routePolylineGlowRef = useRef<L.Polyline | null>(null);
  const routePolylineInnerRef = useRef<L.Polyline | null>(null);

  // Synchronize incoming navigation target from props
  useEffect(() => {
    if (activeNavigationDestination) {
      setActiveRouteTarget(activeNavigationDestination);
    }
  }, [activeNavigationDestination]);

  // Route calculation and polyline rendering effect
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!activeRouteTarget || !map) {
      if (routePolylineGlowRef.current) {
        routePolylineGlowRef.current.remove();
        routePolylineGlowRef.current = null;
      }
      if (routePolylineInnerRef.current) {
        routePolylineInnerRef.current.remove();
        routePolylineInnerRef.current = null;
      }
      setRouteResult(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingRoute(true);

    calculateRoute(
      [userGps.lat, userGps.lng],
      [activeRouteTarget.lat, activeRouteTarget.lng],
      routeMode
    ).then((result) => {
      if (isCancelled || !leafletMapRef.current) return;
      setIsLoadingRoute(false);
      setRouteResult(result);

      if (routePolylineGlowRef.current) routePolylineGlowRef.current.remove();
      if (routePolylineInnerRef.current) routePolylineInnerRef.current.remove();

      // Outer Glow Polyline (soft cyan aura)
      const glow = L.polyline(result.points, {
        color: '#0284c7',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(leafletMapRef.current);

      // Inner Sharp Polyline (dash for walking, solid for driving)
      const inner = L.polyline(result.points, {
        color: '#38bdf8',
        weight: 4.5,
        opacity: 0.95,
        dashArray: routeMode === 'walking' ? '5, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(leafletMapRef.current);

      routePolylineGlowRef.current = glow;
      routePolylineInnerRef.current = inner;

      leafletMapRef.current.fitBounds(L.latLngBounds(result.points), {
        padding: [70, 70],
        maxZoom: 16,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [activeRouteTarget, routeMode, userGps.lat, userGps.lng]);

  const handleFitRoute = useCallback(() => {
    const map = leafletMapRef.current;
    if (!map || !routeResult || routeResult.points.length === 0) return;
    map.fitBounds(L.latLngBounds(routeResult.points), {
      padding: [70, 70],
      maxZoom: 16,
    });
  }, [routeResult]);

  const handleCloseRoute = useCallback(() => {
    setActiveRouteTarget(null);
    setRouteResult(null);
    if (routePolylineGlowRef.current) {
      routePolylineGlowRef.current.remove();
      routePolylineGlowRef.current = null;
    }
    if (routePolylineInnerRef.current) {
      routePolylineInnerRef.current.remove();
      routePolylineInnerRef.current = null;
    }
    onClearNavigation?.();
  }, [onClearNavigation]);

  // Zoom-adaptive pin opacity: bright and vivid at mid/far zoom (<= 14),
  // smoothly transitioning down to 35-40% at high street zoom (>= 17)
  const pinOpacity = useMemo(() => {
    if (zoom <= 14) return 1.0;
    return Math.max(0.38, Math.min(1.0, 1.0 - (zoom - 14) * 0.21));
  }, [zoom]);

  // Open data places: compact subtle grey dots on far zoom (< 14),
  // smoothly revealing into translucent category icon badges on close zoom (>= 14) or hover/select
  const isOpenDataDotsMode = zoom < 14;
  const openDataPinOpacity = useMemo(() => {
    if (zoom <= 13) return 0.65;
    if (zoom === 14) return 0.85;
    return 0.95;
  }, [zoom]);

  // Filtered open data places based on selected place category
  const visibleOpenDataPlaces = useMemo(() => {
    if (selectedPlaceCategory === 'all') return OPEN_DATA_PLACES;
    return OPEN_DATA_PLACES.filter((p) => p.category === selectedPlaceCategory);
  }, [selectedPlaceCategory]);

  // Filter events based on active category
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      return selectedCategory === 'all' || ev.category === selectedCategory;
    });
  }, [events, selectedCategory]);

  // Spatial Aggregation: Cluster events based on geographic proximity and zoom level.
  const clusters = useMemo<MapCluster[]>(() => {
    if (filteredEvents.length === 0) return [];

    const mergeRadiusMeters = Math.max(120, 180 * Math.pow(1.85, 14 - zoom));
    const computed: MapCluster[] = [];
    const visited = new Set<number>();

    for (let i = 0; i < filteredEvents.length; i++) {
      if (visited.has(i)) continue;
      const group: MeetupEvent[] = [filteredEvents[i]];
      visited.add(i);

      for (let j = i + 1; j < filteredEvents.length; j++) {
        if (visited.has(j)) continue;
        const dist = getDistanceMeters(
          filteredEvents[i].lat,
          filteredEvents[i].lng,
          filteredEvents[j].lat,
          filteredEvents[j].lng
        );

        if (dist <= mergeRadiusMeters) {
          group.push(filteredEvents[j]);
          visited.add(j);
        }
      }

      const totalCount = group.length;
      const avgLat = group.reduce((sum, g) => sum + g.lat, 0) / totalCount;
      const avgLng = group.reduce((sum, g) => sum + g.lng, 0) / totalCount;
      const maxR = Math.max(...group.map((g) => g.activityRadiusMeters));
      const densityInfo = getDensityColor(totalCount);

      computed.push({
        id: `cluster-${group.map((g) => g.id).join('-')}`,
        lat: avgLat,
        lng: avgLng,
        events: group,
        densityCount: totalCount,
        colorHex: densityInfo.hex,
        colorRgb: densityInfo.rgb,
        radiusMeters: (maxR + Math.min(600, (totalCount - 1) * 250)) * 1.85,
      });
    }

    return computed;
  }, [filteredEvents, zoom]);

  // Calculate top 5 central events closest to the center of the viewport
  // This satisfies the user's explicit rule: "max 5 vidět v centru obrazovky" with smaller labels
  const top5CentralEventIds = useMemo<Set<string>>(() => {
    const map = leafletMapRef.current;
    if (!map || filteredEvents.length === 0) {
      return new Set(filteredEvents.slice(0, 5).map((e) => e.id));
    }

    const size = map.getSize();
    const centerPt = { x: size.x / 2, y: size.y / 2 };

    const scored = filteredEvents.map((ev) => {
      const pt = map.latLngToContainerPoint([ev.lat, ev.lng]);
      const isInside = pt.x >= -30 && pt.x <= size.x + 30 && pt.y >= -30 && pt.y <= size.y + 30;
      const distPx = isInside ? Math.hypot(pt.x - centerPt.x, pt.y - centerPt.y) : 999999;
      return { id: ev.id, distPx };
    });

    scored.sort((a, b) => a.distPx - b.distPx);
    return new Set(scored.slice(0, 5).map((s) => s.id));
  }, [filteredEvents, panTick]);

  // Positioned pins with collision avoidance & high-zoom detection
  const isExtremeZoom = zoom >= 16;

  const positionedPins = useMemo(() => {
    const map = leafletMapRef.current;
    if (!map) return [];

    const occupiedBoxes: { x1: number; y1: number; x2: number; y2: number }[] = [];

    return filteredEvents.map((ev, index) => {
      const pt = map.latLngToContainerPoint([ev.lat, ev.lng]);
      const isVisible = !(
        pt.x < -160 ||
        pt.y < -160 ||
        pt.x > window.innerWidth + 160 ||
        pt.y > window.innerHeight + 160
      );

      if (!isVisible) {
        return {
          ev,
          pt,
          isVisible: false,
          isExpanded: false,
          offsetY: 0,
          offsetX: 0,
        };
      }

      // Event title expands ONLY on hover or direct selection to prevent chaotic clumping
      const isHovered = hoveredEventId === ev.id;
      const isSelected = selectedPinId === ev.id;
      const isExpanded = isHovered || isSelected;

      const width = isExpanded ? 114 : 34;
      const height = isExpanded ? 32 : 34;

      let offsetY = 0;
      let offsetX = 0;

      if (isExpanded) {
        let boxX1 = pt.x - width / 2;
        let boxY1 = pt.y - height;
        let boxX2 = pt.x + width / 2;
        let boxY2 = pt.y;

        let collisionCount = 0;
        for (const b of occupiedBoxes) {
          const overlaps = !(
            boxX2 + 6 < b.x1 ||
            boxX1 - 6 > b.x2 ||
            boxY2 + 4 < b.y1 ||
            boxY1 - 4 > b.y2
          );
          if (overlaps) {
            collisionCount++;
            offsetY -= (height + 8);
            if (collisionCount % 2 === 1) {
              offsetX += (index % 2 === 0 ? 10 : -10);
            }
            boxX1 = pt.x + offsetX - width / 2;
            boxX2 = pt.x + offsetX + width / 2;
            boxY1 = pt.y + offsetY - height;
            boxY2 = pt.y + offsetY;
          }
        }

        occupiedBoxes.push({
          x1: boxX1,
          y1: boxY1,
          x2: boxX2,
          y2: boxY2,
        });
      }

      return {
        ev,
        pt,
        isVisible: true,
        isExpanded,
        isHovered,
        isSelected,
        offsetY,
        offsetX,
      };
    });
  }, [filteredEvents, zoom, isExtremeZoom, hoveredEventId, selectedPinId, panTick]);

  // Pure canvas drawing function
  const drawCanvas = useCallback(() => {
    const map = leafletMapRef.current;
    const canvas = heatmapCanvasRef.current;
    if (!map || !canvas) return;

    const currentZoom = map.getZoom();
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== size.x * dpr || canvas.height !== size.y * dpr) {
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.x, size.y);
    ctx.globalCompositeOperation = 'source-over';

    // Zoom-adaptive halo parameters: silky translucent glow without harsh glare or muddy burnout
    const isCloseZoom = currentZoom >= 16;
    const isMidZoom = currentZoom >= 14 && currentZoom < 16;

    clusters.forEach((cl) => {
      const pt = map.latLngToContainerPoint([cl.lat, cl.lng]);
      const rawPx = metersToPixels(cl.radiusMeters, cl.lat, currentZoom);

      // User Requirement: "круги большие с небольшым размытием и чуть прозрачнее при приближении"
      let radiusPx: number;
      if (isCloseZoom) {
        radiusPx = Math.max(70, Math.min(180, rawPx * 1.1));
      } else if (isMidZoom) {
        radiusPx = Math.max(105, Math.min(250, rawPx * 1.55));
      } else {
        radiusPx = Math.max(130, Math.min(320, rawPx * 2.0));
      }

      if (
        pt.x + radiusPx < -60 ||
        pt.x - radiusPx > size.x + 60 ||
        pt.y + radiusPx < -60 ||
        pt.y - radiusPx > size.y + 60
      ) {
        return;
      }

      const [r, g, b] = cl.colorRgb;
      // High visibility at normal zoom, and slightly more translucent when zoomed in (isCloseZoom)
      const baseAlpha = isCloseZoom
        ? Math.min(0.24, 0.16 + Math.min(3, cl.densityCount - 1) * 0.025)
        : isMidZoom
        ? Math.min(0.38, 0.25 + Math.min(3, cl.densityCount - 1) * 0.04)
        : Math.min(0.46, 0.32 + Math.min(3, cl.densityCount - 1) * 0.045);

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radiusPx);

      // Large luminous circles with soft perimeter blur ("большие круги с небольшим размытием")
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${(baseAlpha * 1.0).toFixed(2)})`);
      grad.addColorStop(0.50, `rgba(${r}, ${g}, ${b}, ${(baseAlpha * 0.85).toFixed(2)})`);
      grad.addColorStop(0.78, `rgba(${r}, ${g}, ${b}, ${(baseAlpha * 0.45).toFixed(2)})`);
      grad.addColorStop(0.92, `rgba(${r}, ${g}, ${b}, ${(baseAlpha * 0.15).toFixed(2)})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [clusters]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userGps.lat, userGps.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 8,
      attribution: '&copy; OpenStreetMap | WIBE-SIDE',
    }).addTo(map);

    // 1. Dark Vignette / Mask for all areas OUTSIDE Královéhradecký kraj:
    // Outer bounding rectangle covering Czechia / Central Europe with Královéhradecký kraj as a hole!
    const worldOuterBounds: [number, number][] = [
      [53.0, 11.0],
      [53.0, 20.0],
      [47.5, 20.0],
      [47.5, 11.0],
    ];

    // Precise Official Administrative Boundary Polygon for Královéhradecký kraj:
    // Captures the complete administrative perimeter: Krkonoše, Broumovsko promontory, Orlické hory, Chlumecko & Český ráj
    const kralovehradeckyKrajPolygon: [number, number][] = [
      // Krkonoše crest (Czech-Polish state border)
      [50.774, 15.548], // Szrenica / Violík area
      [50.768, 15.612], // Labská louka / Pramen Labe
      [50.751, 15.658], // Dívčí kameny
      [50.741, 15.705], // Slezské sedlo / Luční hora
      [50.736, 15.739], // Sněžka (1603 m)
      [50.748, 15.795], // Černá kopa / Svorová hora
      [50.731, 15.861], // Pomezní Boudy / Horní Malá Úpa
      [50.702, 15.918], // Žacléřsko / Královecký průsmyk
      [50.672, 15.992], // Bernartice u Trutnova
      // Broumovsko Promontory (Broumovský výběžek - northern apex)
      [50.648, 16.052], // Janovice u Trutnova
      [50.623, 16.124], // Teplice nad Metují / Skály
      [50.646, 16.208], // Zdoňov / Adršpašsko
      [50.655, 16.279], // Ruprechtický Špičák (Javoří hory)
      [50.624, 16.368], // Janovičky / Broumovský hřeben
      [50.563, 16.422], // Šonov u Broumova
      [50.519, 16.381], // Božanov / Koruna
      [50.495, 16.326], // Machov / Stolové hory
      [50.448, 16.234], // Velké Poříčí / Hronov
      [50.419, 16.184], // Náchod / Běloves hraniční přechod
      [50.378, 16.242], // Česká Čermná / Peklo
      // Orlické hory crest (Rychnov nad Kněžnou district)
      [50.347, 16.328], // Nový Hrádek / Olešnice v Orl. h.
      [50.308, 16.398], // Deštné v Orlických horách / Šerlich
      [50.252, 16.442], // Velká Deštná (1115 m)
      [50.211, 16.498], // Kunštátská kaple / Říčky v O.h.
      [50.174, 16.541], // Rokytnice v Orlických horách
      [50.138, 16.592], // Bartošovice v Orlických horách / Zemská brána
      // Southern border facing Pardubický kraj
      [50.102, 16.482], // Klášterec nad Orlicí border
      [50.089, 16.394], // Vamberk / Doudleby nad Orlicí
      [50.065, 16.284], // Kostelec nad Orlicí
      [50.054, 16.172], // Čestice / Lípa nad Orlicí
      [50.078, 16.068], // Týniště nad Orlicí
      [50.095, 15.932], // Třebechovice pod Orebem
      [50.125, 15.828], // Vysoká nad Labem / Opatovice
      [50.136, 15.698], // Praskačka / Urbanice
      [50.155, 15.582], // Dobřenice / Chlumec nad Cidlinou south
      // Southwestern border facing Středočeský kraj (Královéhradecko / Novobydžovsko / Jičínsko)
      [50.162, 15.421], // Chlumec nad Cidlinou / Žiželice
      [50.218, 15.342], // Městec Králové border / Nový Bydžov west
      [50.278, 15.265], // Dymokury / Rožďalovice border
      [50.334, 15.228], // Kopidlno / Libáň
      [50.412, 15.195], // Dětenice / Markvartice
      // Western border facing Liberecký kraj (Český ráj / Jičín / Podkrkonoší)
      [50.485, 15.176], // Sobotka / Humprecht / Kost
      [50.518, 15.244], // Prachov / Jinolice / Mladějov
      [50.548, 15.312], // Lomnice nad Popelkou border
      [50.592, 15.428], // Nová Paka / Stará Paka
      [50.628, 15.512], // Studenec / Dolní Kalná
      [50.639, 15.586], // Vrchlabí / Lánov
      [50.685, 15.534], // Strážné / Herlíkovice
      [50.728, 15.518], // Špindlerův Mlýn / Labský důl
      [50.774, 15.548], // Close loop at Violík
    ];

    // Subtle soft vignette: Outside areas are gently dimmed (fillOpacity 0.30)
    L.polygon([worldOuterBounds, kralovehradeckyKrajPolygon], {
      color: 'transparent',
      fillColor: '#0f172a', // soft slate
      fillOpacity: 0.30,
      interactive: false,
    }).addTo(map);

    // 2. Green glowing boundary for Královéhradecký kraj
    L.polyline(kralovehradeckyKrajPolygon, {
      color: '#22c55e', // Vibrant emerald green
      weight: 3,
      opacity: 0.92,
      smoothFactor: 1.2,
      interactive: false,
    }).addTo(map);

    // Outer soft glow for the green border
    L.polyline(kralovehradeckyKrajPolygon, {
      color: '#4ade80',
      weight: 6,
      opacity: 0.35,
      smoothFactor: 1.2,
      interactive: false,
    }).addTo(map);

    leafletMapRef.current = map;

    const onMapMove = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        setPanTick((t) => (t + 1) % 10000);
      });
    };

    const onMapZoom = () => {
      setZoom(map.getZoom());
      onMapMove();
    };

    // User requirement: Clicking on empty map spot dismisses the opened event!
    const onMapClick = (e: L.LeafletMouseEvent) => {
      const originalTarget = e.originalEvent?.target as HTMLElement | null;
      if (originalTarget && originalTarget.closest('button, .pointer-events-auto')) {
        return;
      }
      onEmptyMapClick?.();
      setHoveredEventId(null);
      setSelectedPinId(null);
    };

    map.on('move', onMapMove);
    map.on('zoomend', onMapZoom);
    map.on('viewreset', onMapMove);
    map.on('resize', onMapMove);
    map.on('click', onMapClick);

    setTimeout(() => {
      map.invalidateSize();
      setPanTick((t) => (t + 1) % 10000);
    }, 100);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      map.off('move', onMapMove);
      map.off('zoomend', onMapZoom);
      map.off('viewreset', onMapMove);
      map.off('resize', onMapMove);
      map.off('click', onMapClick);
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Redraw canvas on cluster/pan change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, panTick]);

  const handleCenterOnUser = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    map.flyTo([userGps.lat, userGps.lng], 15, { duration: 0.65 });
  };

  const handleFlyToEvent = (ev: MeetupEvent) => {
    const map = leafletMapRef.current;
    if (!map) return;
    map.flyTo([ev.lat, ev.lng], 15, { duration: 0.65 });
  };

  const handleZoomStep = (delta: number) => {
    const map = leafletMapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta);
  };

  const isFarZoomOut = zoom < 12;

  const map = leafletMapRef.current;
  const userPt = map ? map.latLngToContainerPoint([userGps.lat, userGps.lng]) : null;
  const checkInRadiusPx = map
    ? Math.max(16, metersToPixels(100, userGps.lat, zoom))
    : 24;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-slate-950"
      onClick={() => {
        // Tapping background container also dismisses open event
        onEmptyMapClick?.();
      }}
    >
      {/* Base Leaflet Map */}
      <div ref={mapContainerRef} className="wibe-leaflet-container z-0" />

      {/* Heatmap Canvas Overlay */}
      <canvas
        ref={heatmapCanvasRef}
        className="pointer-events-none absolute inset-0 z-10"
      />

      {/* User GPS Location Marker */}
      {userPt && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${userPt.x}px`,
            top: `${userPt.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="rounded-full border border-dashed border-emerald-400/70 bg-emerald-500/10 flex items-center justify-center animate-pulse"
            style={{
              width: `${checkInRadiusPx * 2}px`,
              height: `${checkInRadiusPx * 2}px`,
            }}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-xl" />
            {!isFarZoomOut && (
              <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-[9.5px] font-bold text-emerald-300 whitespace-nowrap border border-emerald-500/30">
                Domov / GPS
              </span>
            )}
          </div>
        </div>
      )}

      {/* Event Pins Layer */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {map &&
          clusters.map((cluster) => {
            const clusterDensity = cluster.densityCount;
            const densityColor = getDensityColor(clusterDensity);

            // Zoomed far out: compact cluster badge
            if (isFarZoomOut) {
              const pt = map.latLngToContainerPoint([cluster.lat, cluster.lng]);
              if (
                pt.x < -60 ||
                pt.y < -60 ||
                pt.x > window.innerWidth + 60 ||
                pt.y > window.innerHeight + 60
              ) {
                return null;
              }

              const primaryEvent = cluster.events[0];

              return (
                <div
                  key={cluster.id}
                  className="pointer-events-auto absolute transition-transform duration-150"
                  style={{
                    left: `${pt.x}px`,
                    top: `${pt.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(primaryEvent);
                    }}
                    className="group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-2xl border-2 transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: densityColor.hex,
                      borderColor: '#ffffff',
                      color: '#ffffff',
                    }}
                    title={`${cluster.events.map((e) => e.title).join(', ')}`}
                  >
                    <CategoryIcon category={primaryEvent.category} className="w-4 h-4 shrink-0" />
                    {clusterDensity > 1 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold font-mono-tabular bg-slate-950/90 text-white">
                        {clusterDensity}
                      </span>
                    )}
                  </button>
                </div>
              );
            }

            // Render collision-free positioned pins
            return positionedPins
              .filter((p) => p.isVisible)
              .map(({ ev, pt, isExpanded, isHovered, isSelected, offsetY, offsetX = 0 }) => {
                const categoryMeta = CATEGORY_MAP[ev.category];
                const catColor = categoryMeta.colorHex;
                const ratingScore = calculateEventRating(ev.comments);
                const ratingBadge = getRatingBadgeColor(ratingScore);
                const coverPhoto = ev.media[0]?.url;
                const distFromUser = getDistanceMeters(userGps.lat, userGps.lng, ev.lat, ev.lng);

                return (
                  <div
                    key={ev.id}
                    className="pointer-events-auto absolute transition-all duration-150"
                    style={{
                      left: `${pt.x + offsetX}px`,
                      top: `${pt.y + offsetY}px`,
                      transform: 'translate(-50%, -100%)',
                      zIndex: isHovered ? 60 : isSelected ? 50 : isExpanded ? 40 : 25,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Clicking sets selectedPinId and opens event
                      setSelectedPinId(ev.id);
                    }}
                    onMouseEnter={() => setHoveredEventId(ev.id)}
                    onMouseLeave={() => setHoveredEventId((prev) => (prev === ev.id ? null : prev))}
                    onTouchStart={() => {
                      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
                      longPressTimerRef.current = window.setTimeout(() => {
                        setHoveredEventId(ev.id);
                      }, 350);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimerRef.current) {
                        window.clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = null;
                      }
                    }}
                  >
                    {/* Hover Preview Card (appears on hover) */}
                    {isHovered && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className="mb-2 w-60 rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-slate-700 shadow-2xl overflow-hidden cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                      >
                        <div className="relative h-28 w-full bg-slate-800">
                          <img
                            src={coverPhoto}
                            alt={ev.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-slate-200">
                            <span className="font-semibold truncate">{ev.city}</span>
                            <span className="font-mono-tabular text-[10px] text-emerald-300 font-bold">
                              {distFromUser < 1000
                                ? `${distFromUser} m`
                                : `${(distFromUser / 1000).toFixed(1)} km`}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="text-[10px] text-slate-400 flex items-center justify-between gap-1">
                            <span className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: catColor }}
                              />
                              {categoryMeta.name} · {ev.startTime}
                            </span>
                            {ev.isActive ? (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                                Teď
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                SMS
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white mt-1 line-clamp-1">
                            {ev.title}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
                            <span>Klepněte pro otevření</span>
                            <span className="font-mono-tabular">
                              {ratingScore > 0 ? `★ ${ratingScore.toFixed(1)}` : 'Nová akce'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EVENT TITLE BADGE: Displayed ONLY when hovered, clicked/selected, or at extreme zoom (>= 16) */}
                    {isExpanded ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className="group flex flex-col items-center cursor-pointer"
                      >
                        <div
                          className="rounded-lg shadow-lg border px-1.5 py-0.5 flex items-center gap-1 transition-transform group-hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: '#090e1cee',
                            borderColor: catColor,
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          {/* Category-colored icon badge */}
                          <div
                            className="w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: catColor,
                              color: '#ffffff',
                            }}
                          >
                            <CategoryIcon category={ev.category} className="w-2.5 h-2.5" />
                          </div>

                          {/* Compact micro-text */}
                          <div className="flex flex-col text-left max-w-[95px] overflow-hidden">
                            <span className="text-[8.5px] font-bold text-white line-clamp-1 leading-tight truncate">
                              {ev.title}
                            </span>
                            <span
                              className="text-[7.5px] font-semibold line-clamp-1 leading-none truncate"
                              style={{ color: catColor }}
                            >
                              {categoryMeta.shortName} · {ev.city}
                            </span>
                          </div>

                          <span
                            className={`px-1 py-0.1 rounded text-[8px] font-extrabold font-mono-tabular shrink-0 ${ratingBadge.bgClass}`}
                          >
                            {ratingScore.toFixed(1)}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isRegistered) {
                                onRequireRegistration?.('like');
                              } else {
                                onToggleLike(ev.id);
                              }
                            }}
                            className={`ml-0.5 flex items-center gap-0.5 text-[8px] font-mono-tabular ${
                              ev.isLikedByMe ? 'text-red-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Heart className={`w-2 h-2 ${ev.isLikedByMe ? 'fill-current' : ''}`} />
                            <span>{ev.likesCount}</span>
                          </button>
                        </div>

                        {/* Tiny pointer tick matching category color */}
                        <div
                          className="w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b"
                          style={{
                            backgroundColor: '#090e1cee',
                            borderColor: catColor,
                          }}
                        />
                      </div>
                    ) : (
                      /* HIGH-CONTRAST DISTINCTIVE CATEGORY PIN (CRISP & CLEAN) */
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPinId(ev.id);
                          onSelectEvent(ev);
                        }}
                        style={{
                          opacity: isHovered || isSelected ? 1 : pinOpacity,
                          transition: 'opacity 250ms ease, transform 150ms ease',
                        }}
                        className="group relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 active:scale-95"
                        title={`${ev.title} (${categoryMeta.name})`}
                      >
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: '#0c1324',
                            borderColor: catColor,
                            color: catColor,
                            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.7), 0 0 6px ${catColor}55`,
                          }}
                        >
                          <CategoryIcon category={ev.category} className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                        </div>
                        {isSelected && (
                          <div
                            className="absolute inset-0 rounded-full animate-ping opacity-35 pointer-events-none"
                            style={{ backgroundColor: catColor }}
                          />
                        )}
                      </button>
                    )}
                  </div>
                );
              });
          })}

        {/* Real Open Data Places of Královéhradecký kraj (Knihovny, Muzea, Příroda, Kina, Kulturní domy) */}
        {map &&
          showOpenDataPlaces &&
          visibleOpenDataPlaces.map((place) => {
            const pt = map.latLngToContainerPoint([place.lat, place.lng]);
            if (
              pt.x < -60 ||
              pt.y < -60 ||
              pt.x > window.innerWidth + 60 ||
              pt.y > window.innerHeight + 60
            ) {
              return null;
            }

            const isSelected = selectedOpenDataPlace?.id === place.id;
            const isHovered = hoveredOpenDataId === place.id;
            const showAsIcon = !isOpenDataDotsMode || isHovered || isSelected;
            const catColor = getOpenDataColor(place.category);

            return (
              <div
                key={place.id}
                className="pointer-events-auto absolute transition-transform duration-100"
                style={{
                  left: `${pt.x}px`,
                  top: `${pt.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 35 : isHovered ? 34 : 22,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpenDataPlace(place);
                  }}
                  onMouseEnter={() => setHoveredOpenDataId(place.id)}
                  onMouseLeave={() => setHoveredOpenDataId((prev) => (prev === place.id ? null : prev))}
                  style={{
                    opacity: isSelected || isHovered ? 1 : openDataPinOpacity,
                    transition: 'opacity 250ms ease, transform 150ms ease',
                  }}
                  className="group relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 active:scale-95"
                  title={`${place.name} · ${getOpenDataCategoryLabel(place.category)} (${place.city})`}
                >
                  {showAsIcon ? (
                    /* EXPANDED CATEGORY ICON (on zoom >= 14 or hovered/selected) */
                    <div
                      className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center shadow-lg border transition-all"
                      style={{
                        backgroundColor: '#0c1324dd',
                        borderColor: isSelected ? '#ffffff' : catColor,
                        color: isSelected ? '#ffffff' : catColor,
                        backdropFilter: 'blur(4px)',
                        boxShadow: `0 2px 6px rgba(0, 0, 0, 0.7), 0 0 6px ${catColor}55`,
                      }}
                    >
                      {getOpenDataIcon(place.category, 'w-3 h-3 sm:w-3.5 sm:h-3.5')}
                    </div>
                  ) : (
                    /* COMPACT GREY DOT (on far zoom < 14) */
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400/80 border border-slate-600/90 shadow-xs transition-transform group-hover:scale-150 group-hover:bg-slate-200" />
                  )}
                </button>
              </div>
            );
          })}
      </div>

      {/* Floating Top Controls (Filter + Open Data Místa + 5km SMS Radar + My GPS) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left: Category Filter Button + Places Toggle + Counter */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e2d4a] p-1 rounded-xl shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterDrawer((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[34px] ${
              selectedCategory !== 'all'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">
              {selectedCategory === 'all'
                ? 'Kategorie'
                : CATEGORY_MAP[selectedCategory].name}
            </span>
          </button>

          {/* Open Data Places Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowOpenDataPlaces((prev) => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[34px] ${
              showOpenDataPlaces
                ? selectedPlaceCategory !== 'all'
                  ? 'bg-slate-700 text-white border border-slate-500 shadow-sm'
                  : 'bg-slate-800 text-slate-100 border border-slate-600/70 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Zobrazit veřejná místa kraje (knihovny, muzea, památky, hřiště, příroda, kina)"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] sm:text-xs">
              Místa ({visibleOpenDataPlaces.length})
            </span>
          </button>

          <span
            className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-mono-tabular text-emerald-400 border border-slate-800"
            title="Aktivní akce v regionu"
          >
            {filteredEvents.length} akcí
          </span>
        </div>

        {/* Right: SMS Radar 5km instant toggle + My GPS */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <SmsRadar5Km
            events={events}
            userGps={userGps}
            defaultPhone={userPhone}
            isRegistered={isRegistered}
            onRequireRegistration={onRequireRegistration}
            onSelectEvent={onSelectEvent}
            onFlyToEvent={handleFlyToEvent}
            onUpdatePhone={onUpdatePhone}
            onRequestGpsUpdate={onRequestRealGps}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCenterOnUser();
            }}
            className="h-9 px-2.5 rounded-xl bg-[#0f172a]/95 backdrop-blur-md border border-[#1e2d4a] text-emerald-400 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors"
            title="Vycentrovat na moji GPS polohu (Domov)"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px]">GPS Domov</span>
          </button>
        </div>
      </div>

      {/* Category & Places Filter Drawer */}
      {showFilterDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 left-3 right-3 sm:right-auto sm:w-88 z-40 rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#1e2d4a] p-3 shadow-2xl animate-in fade-in duration-150 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white font-display">Filtrovat mapu</span>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Zavřít
            </button>
          </div>

          {/* Section 1: Event Categories */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Události komunity
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onSelectCategory('all');
                  setShowFilterDrawer(false);
                }}
                className={`p-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-white text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Všechny akce ({events.length})
              </button>
              {(Object.keys(CATEGORY_MAP) as EventCategory[]).map((catKey) => {
                const cat = CATEGORY_MAP[catKey];
                const isSelected = selectedCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      onSelectCategory(catKey);
                      setShowFilterDrawer(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <CategoryIcon category={catKey} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-[11px]">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Open Data Places Categories */}
          <div className="pt-3 mt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Veřejná místa (Kraj KHK)
              </span>
              <button
                type="button"
                onClick={() => setShowOpenDataPlaces((prev) => !prev)}
                className="text-[10px] text-sky-400 hover:underline"
              >
                {showOpenDataPlaces ? 'Skrýt na mapě' : 'Zobrazit na mapě'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setSelectedPlaceCategory('all');
                  setShowOpenDataPlaces(true);
                  setShowFilterDrawer(false);
                }}
                className={`p-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  selectedPlaceCategory === 'all'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Všechna místa ({OPEN_DATA_PLACES.length})
              </button>
              {(
                [
                  'priroda',
                  'kino',
                  'kulturak',
                  'knihovna',
                  'muzeum',
                  'turistika',
                  'hriste',
                ] as OpenDataCategory[]
              ).map((placeCat) => {
                const count = OPEN_DATA_PLACES.filter((p) => p.category === placeCat).length;
                const isSelected = selectedPlaceCategory === placeCat;
                const catColor = getOpenDataColor(placeCat);
                return (
                  <button
                    key={placeCat}
                    onClick={() => {
                      setSelectedPlaceCategory(placeCat);
                      setShowOpenDataPlaces(true);
                      setShowFilterDrawer(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold text-left flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'text-white border'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: '#1e293b', borderColor: catColor }
                        : undefined
                    }
                  >
                    <span style={{ color: catColor }}>
                      {getOpenDataIcon(placeCat, 'w-3.5 h-3.5 shrink-0')}
                    </span>
                    <span className="truncate text-[11px]">
                      {getOpenDataCategoryLabel(placeCat)} ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Right Map Controls (Zoom + GPS/Tester + Legend) */}
      <div
        className="absolute right-3 bottom-20 z-30 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowGpsDrawer((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xl transition-colors ${
            showGpsDrawer
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-slate-900/90 text-emerald-400 border-slate-800 hover:bg-slate-800 backdrop-blur-md'
          }`}
          title="Správa GPS domova a testovací poloha"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowLegend((prev) => !prev)}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xl transition-colors ${
            showLegend
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:bg-slate-800 backdrop-blur-md'
          }`}
          title="Legenda hustoty a barev"
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="flex flex-col rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
          <button
            onClick={() => handleZoomStep(1)}
            className="w-10 h-10 flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors border-b border-slate-800"
            title="Přiblížit"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoomStep(-1)}
            className="w-10 h-10 flex items-center justify-center text-slate-200 hover:bg-slate-800 transition-colors"
            title="Oddálit"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NOTE: Map type / zoom status pill REMOVED as requested by user ("priblizeno:plne detaily a hodnoceni") */}

      {/* Floating GPS Drawer / Tester */}
      {showGpsDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-14 bottom-20 z-40 w-80 max-w-[calc(100vw-4.5rem)] rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#1e2d4a] p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white font-display">Moje GPS poloha (Domov)</h4>
              <p className="text-[11px] text-emerald-400 font-mono-tabular">
                {userGps.lat.toFixed(4)}° N, {userGps.lng.toFixed(4)}° E
              </p>
            </div>
            <button
              onClick={() => setShowGpsDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Zavřít
            </button>
          </div>

          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            Aktuálně uloženo: <strong className="text-white">{userGps.label}</strong>. Aplikace si ji pamatuje jako váš domov, dokud ji neaktualizujete.
          </p>

          <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => {
                onRequestRealGps();
                setShowGpsDrawer(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>Zapnout GPS / Načíst reálnou polohu</span>
            </button>

            {events.slice(0, 4).map((ev) => (
              <button
                key={ev.id}
                onClick={() => {
                  onUpdateUserGps(ev.lat + 0.0002, ev.lng + 0.0002, `Poblíž: ${ev.title}`);
                  leafletMapRef.current?.flyTo([ev.lat, ev.lng], 15, { duration: 0.6 });
                  setShowGpsDrawer(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between gap-2"
              >
                <span className="truncate">{ev.title}</span>
                <span className="text-[10px] font-mono-tabular text-emerald-400 shrink-0">
                  25 m
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Legend Panel */}
      {showLegend && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-14 bottom-20 z-40 w-72 rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-[#1e2d4a] p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white font-display">
              Legenda barev a hustoty (Heatmap)
            </h4>
            <button
              onClick={() => setShowLegend(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Zavřít
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <p className="font-semibold text-slate-400 text-[11px]">
              Barevná škála podle počtu akcí:
            </p>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 shadow-sm" />
              <span className="text-slate-200">Jantarová: 1 akce (klidná aktivita)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shrink-0 shadow-sm" />
              <span className="text-slate-200">Zlatá: 2 akce</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0 shadow-sm" />
              <span className="text-slate-200">Teplá žlutá: 3–4 akce</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-lime-500 shrink-0" />
              <span className="text-slate-200">Světle zelená: 5 akcí</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-200 font-semibold text-emerald-300">Zelená: 6+ akcí (nejzelenější hotspot)</span>
            </div>
          </div>
        </div>
      )}

      {/* Open Data Place Detail Modal */}
      {selectedOpenDataPlace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedOpenDataPlace(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo Header */}
            <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
              <img
                src={selectedOpenDataPlace.photoUrl}
                alt={selectedOpenDataPlace.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />

              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedOpenDataPlace(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Zavřít"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Badges on photo */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                <span
                  className="px-2.5 py-1 rounded-full bg-slate-900/90 border text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  style={{
                    borderColor: `${getOpenDataColor(selectedOpenDataPlace.category)}66`,
                    color: getOpenDataColor(selectedOpenDataPlace.category),
                  }}
                >
                  {getOpenDataIcon(selectedOpenDataPlace.category)}
                  <span>{getOpenDataCategoryLabel(selectedOpenDataPlace.category)}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                  {selectedOpenDataPlace.tagLabel}
                </span>
              </div>
            </div>

            {/* Place Details Body */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight font-display">
                  {selectedOpenDataPlace.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedOpenDataPlace.address}</span>
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {selectedOpenDataPlace.description}
              </p>

              {/* Clarification info banner: No points */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px]">
                <span className="text-slate-400 font-medium">Zdroj: Otevřená data KHK</span>
                <span className="text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  Veřejné místo · Bez KRJ
                </span>
              </div>

              {/* Venue Capacity and Accessibility Info */}
              {(selectedOpenDataPlace.capacity || selectedOpenDataPlace.accessibility) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedOpenDataPlace.capacity && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">Kapacita</span>
                        <span className="font-bold text-white font-mono-tabular">
                          až {selectedOpenDataPlace.capacity} míst
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedOpenDataPlace.accessibility && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          selectedOpenDataPlace.accessibility === 'ANO'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            : selectedOpenDataPlace.accessibility === 'ČÁSTEČNĚ'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-none">Bezbariérovost</span>
                        <span className="font-bold text-white text-[11px]">
                          {selectedOpenDataPlace.accessibility === 'ANO'
                            ? 'Bezbariérové'
                            : selectedOpenDataPlace.accessibility === 'ČÁSTEČNĚ'
                            ? 'Částečně přístupné'
                            : 'Bariérové'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Website link */}
              {selectedOpenDataPlace.websiteUrl && (
                <a
                  href={
                    selectedOpenDataPlace.websiteUrl.startsWith('http')
                      ? selectedOpenDataPlace.websiteUrl
                      : `https://${selectedOpenDataPlace.websiteUrl}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="truncate">Webové stránky / Program akcí</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              )}

              {/* Action Buttons: Navigate here + Create Event Here */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRouteTarget({
                      lat: selectedOpenDataPlace.lat,
                      lng: selectedOpenDataPlace.lng,
                      title: selectedOpenDataPlace.name,
                      category: selectedOpenDataPlace.category,
                      address: selectedOpenDataPlace.address,
                    });
                    setSelectedOpenDataPlace(null);
                  }}
                  className="h-11 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigovat sem</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCreateEventAtPlace?.(selectedOpenDataPlace);
                    setSelectedOpenDataPlace(null);
                  }}
                  className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Vytvořit sraz</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Navigation HUD Floating Overlay */}
      {activeRouteTarget && (
        <NavigationHud
          destination={activeRouteTarget}
          userGps={userGps}
          route={routeResult}
          isLoading={isLoadingRoute}
          onModeChange={setRouteMode}
          onFitRoute={handleFitRoute}
          onClose={handleCloseRoute}
        />
      )}
    </div>
  );
};
