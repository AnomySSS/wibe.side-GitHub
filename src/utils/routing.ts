import { getDistanceMeters } from '../types';

export type RouteMode = 'walking' | 'driving';

export interface RouteDestination {
  lat: number;
  lng: number;
  title: string;
  category?: string;
  address?: string;
}

export interface RouteResult {
  distanceMeters: number;
  durationMinutes: number;
  points: [number, number][]; // [lat, lng] for Leaflet
  mode: RouteMode;
  isRealRoute: boolean;
}

/**
 * Generates an interpolated natural path between start and end coordinates
 * with slight curve so the fallback route looks like a road rather than a rigid stick.
 */
function generateCurvedFallbackPath(
  start: [number, number],
  end: [number, number],
  segments = 8
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Perpendicular offset for subtle arc
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Orthogonal vector scaled gently
  const perpLat = -dLng * 0.08;
  const perpLng = dLat * 0.08;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Quadratic bezier curve through slightly offset midpoint
    const arc = Math.sin(t * Math.PI);
    const lat = (1 - t) * lat1 + t * lat2 + perpLat * arc;
    const lng = (1 - t) * lng1 + t * lng2 + perpLng * arc;
    points.push([lat, lng]);
  }

  return points;
}

/**
 * Calculates a route from start to end using OSRM public API with instant local fallback
 */
export async function calculateRoute(
  start: [number, number],
  end: [number, number],
  mode: RouteMode = 'walking'
): Promise<RouteResult> {
  const straightDistanceMeters = getDistanceMeters(start[0], start[1], end[0], end[1]);

  // Road tortuosity multiplier: actual street walking / driving is ~22-28% longer than straight line
  const estimatedRoadMeters = Math.round(straightDistanceMeters * 1.25);

  // Speed estimates: walking = 4.8 km/h (80 m/min), driving in region/city = 42 km/h (700 m/min)
  const fallbackMinutes =
    mode === 'walking'
      ? Math.max(1, Math.round(estimatedRoadMeters / 80))
      : Math.max(1, Math.round(estimatedRoadMeters / 700));

  const profile = mode === 'walking' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        const coordinates: [number, number][] = primary.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        const realDistanceMeters = Math.round(primary.distance);
        const realDurationMinutes = Math.max(1, Math.round(primary.duration / 60));

        return {
          distanceMeters: realDistanceMeters,
          durationMinutes: realDurationMinutes,
          points: coordinates,
          mode,
          isRealRoute: true,
        };
      }
    }
  } catch {
    // Network offline or timeout -> use robust curved fallback
  }

  return {
    distanceMeters: estimatedRoadMeters,
    durationMinutes: fallbackMinutes,
    points: generateCurvedFallbackPath(start, end),
    mode,
    isRealRoute: false,
  };
}

/**
 * Format distance in meters or kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in minutes / hours
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hrs} h ${remainingMins} min` : `${hrs} h`;
}

/**
 * Generates Google Maps navigation URL
 */
export function getGoogleMapsUrl(
  endLat: number,
  endLng: number,
  startLat?: number,
  startLng?: number,
  mode: RouteMode = 'walking'
): string {
  const travelMode = mode === 'driving' ? 'driving' : 'walking';
  if (startLat && startLng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=${travelMode}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${endLat},${endLng}&travelmode=${travelMode}`;
}

/**
 * Generates Mapy.cz URL (high popularity in Czech Republic)
 */
export function getMapyCzUrl(
  endLat: number,
  endLng: number,
  startLat?: number,
  startLng?: number
): string {
  if (startLat && startLng) {
    return `https://mapy.cz/zakladni?plan=true&rc=${startLat}%2C${startLng}%2C${endLat}%2C${endLng}`;
  }
  return `https://mapy.cz/zakladni?q=${endLat}%2C${endLng}`;
}
