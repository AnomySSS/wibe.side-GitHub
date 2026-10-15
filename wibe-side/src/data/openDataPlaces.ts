export type OpenDataCategory =
  | 'knihovna'
  | 'muzeum'
  | 'turistika'
  | 'hriste'
  | 'kulturak'
  | 'priroda'
  | 'kino';

export interface OpenDataPlace {
  id: string;
  name: string;
  category: OpenDataCategory;
  city: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
  photoUrl: string;
  tagLabel: string;
  highlight: string;
  capacity?: number;
  accessibility?: 'ANO' | 'ČÁSTEČNĚ' | 'NE';
  websiteUrl?: string;
}

export const OPEN_DATA_PLACES: OpenDataPlace[] = [
  // ================= 1. KNIHOVNY (LIBRARIES) =================
  {
    id: 'place-lib-svk-hk',
    name: 'Studijní a vědecká knihovna v Hradci Králové',
    category: 'knihovna',
    city: 'Hradec Králové',
    lat: 50.2078,
    lng: 15.8272,
    address: 'Hradecká 1250/2, 500 03 Hradec Králové',
    description:
      'Architektonicky oceněná budova tvaru písmene X s moderními studovnami, literární kavárnou a klidným prostředím pro studium a setkání.',
    photoUrl:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Studovna & Kavárna',
    highlight: 'Otevřená data KHK · Wi-Fi zdarma',
  },
  {
    id: 'place-lib-trutnov',
    name: 'Městská knihovna Trutnov',
    category: 'knihovna',
    city: 'Trutnov',
    lat: 50.5611,
    lng: 15.9126,
    address: 'Krakonošovo náměstí 128, 541 01 Trutnov',
    description:
      'Centrální knihovna na historickém náměstí s přednáškovým sálem, komiksovým koutkem a čítárnou s výhledem.',
    photoUrl:
      'https://images.unsplash.com/photo-1507842229451-7f01be7fe7ab?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Centrální čítárna',
    highlight: 'Otevřená data KHK · Komiksový fond',
  },
  {
    id: 'place-lib-nachod',
    name: 'Městská knihovna Náchod',
    category: 'knihovna',
    city: 'Náchod',
    lat: 50.4168,
    lng: 16.1628,
    address: 'Kamenice 105, 547 01 Náchod',
    description:
      'Knihovna na pěší zóně v Náchodě, komunitní prostor pro čtenářské kluby, výstavy a workshopy.',
    photoUrl:
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Knihovna & Pěší zóna',
    highlight: 'Otevřená data KHK · Čtenářský klub',
  },
  {
    id: 'place-lib-jicin',
    name: 'Knihovna Václava Čtvrtka v Jičíně',
    category: 'knihovna',
    city: 'Jičín',
    lat: 50.4371,
    lng: 15.3516,
    address: 'Denisova 400, 506 01 Jičín',
    description:
      'Městská knihovna nesoucí jméno slavného pohádkáře, s dětským oddělením a klubovnou pro deskové hry.',
    photoUrl:
      'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Pohádková knihovna',
    highlight: 'Otevřená data KHK · Klub deskových her',
  },
  {
    id: 'place-lib-rychnov',
    name: 'Městská knihovna Rychnov nad Kněžnou',
    category: 'knihovna',
    city: 'Rychnov nad Kněžnou',
    lat: 50.1631,
    lng: 16.2748,
    address: 'Poláčkovo náměstí 88, 516 01 Rychnov nad Kněžnou',
    description:
      'Knihovna v podhůří Orlických hor s regionální literaturou, badatelnou a tichým dvorkem pro četbu.',
    photoUrl:
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Regionální badatelna',
    highlight: 'Otevřená data KHK · Podorlický fond',
  },
  {
    id: 'place-lib-dknl',
    name: 'Městská knihovna Slavoj Dvůr Králové',
    category: 'knihovna',
    city: 'Dvůr Králové nad Labem',
    lat: 50.4312,
    lng: 15.8145,
    address: 'Tylova 512, 544 01 Dvůr Králové nad Labem',
    description:
      'Historická instituce s modernizovaným sálem a hudebním koutkem pro společenské a kulturní akce.',
    photoUrl:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Slavoj & Čítárna',
    highlight: 'Otevřená data KHK · Hudební koutek',
  },

  // ================= 2. MUZEA A GALERIE =================
  {
    id: 'place-mus-mvck-hk',
    name: 'Muzeum východních Čech v Hradci Králové',
    category: 'muzeum',
    city: 'Hradec Králové',
    lat: 50.2117,
    lng: 15.829,
    address: 'Eliščino nábřeží 465, 500 01 Hradec Králové',
    description:
      'Secesní skvost architekta Jana Kotěry u řeky Labe s bohatými sbírkami archeologie, historie a terasou s rozhledem na soutok.',
    photoUrl:
      'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Kotěrova architektura',
    highlight: 'Národní kulturní památka · Labe',
  },
  {
    id: 'place-mus-gmu-hk',
    name: 'Galerie moderního umění v Hradci Králové',
    category: 'muzeum',
    city: 'Hradec Králové',
    lat: 50.2092,
    lng: 15.8344,
    address: 'Velké náměstí 139, 500 03 Hradec Králové',
    description:
      'Pozdně secesní budova na Velkém náměstí se stálou expozicí českého výtvarného umění 20. a 21. století a střešní vyhlídkou.',
    photoUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Moderní umění & Terasa',
    highlight: 'Střešní kopule · Velké náměstí',
  },
  {
    id: 'place-mus-trutnov',
    name: 'Muzeum Podkrkonoší v Trutnově',
    category: 'muzeum',
    city: 'Trutnov',
    lat: 50.5605,
    lng: 15.9135,
    address: 'Školní 150, 541 01 Trutnov',
    description:
      'Expozice bitvy u Trutnova 1866, historie podkrkonošského tkalcovství a tradice dračí legendy.',
    photoUrl:
      'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Historie 1866 & Drak',
    highlight: 'Otevřená data KHK · Podkrkonoší',
  },
  {
    id: 'place-mus-jicin',
    name: 'Regionální muzeum a galerie v Jičíně',
    category: 'muzeum',
    city: 'Jičín',
    lat: 50.4367,
    lng: 15.3524,
    address: 'Valdštejnovo náměstí 1, 506 01 Jičín',
    description:
      'Sídlo ve Valdštejnském zámku s interaktivní expozicí muzejní herny, numismatiky a valdštejnské éry.',
    photoUrl:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Valdštejnský zámek',
    highlight: 'Zámecká zahrada · Valdštejn',
  },
  {
    id: 'place-mus-rychnov',
    name: 'Muzeum a galerie Orlických hor v Rychnově',
    category: 'muzeum',
    city: 'Rychnov nad Kněžnou',
    lat: 50.1652,
    lng: 16.2755,
    address: 'Jiráskova 2, 516 01 Rychnov nad Kněžnou',
    description:
      'Kolowratský zámek s rozsáhlou obrazárnou, expozicí zvonařství a lidových řemesel Orlických hor.',
    photoUrl:
      'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Kolowratská obrazárna',
    highlight: 'Zvonařství · Orlické hory',
  },
  {
    id: 'place-mus-josefov',
    name: 'Pevnost Josefov & Ravelín No. XIV',
    category: 'muzeum',
    city: 'Jaroměř',
    lat: 50.3392,
    lng: 15.9228,
    address: 'Okružní 34, 551 02 Jaroměř - Josefov',
    description:
      'Unikátní podzemní chodby a bastionová pevnost z doby Josefa II. Atmosférické místo pro historická setkání a prohlídky.',
    photoUrl:
      'https://images.unsplash.com/photo-1590429402507-681603517409?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Vojenská pevnost',
    highlight: 'Podzemní labyrint · Josefov',
  },

  // ================= 3. TURISTICKÁ MÍSTA & ZÁMKY =================
  {
    id: 'place-tur-kuks',
    name: 'Hospital Kuks & Braunův Betlém',
    category: 'turistika',
    city: 'Dvůr Králové nad Labem',
    lat: 50.3986,
    lng: 15.8897,
    address: 'Kuks 81, 544 43 Kuks',
    description:
      'Barokní areál hraběte Šporka se sochami Ctností a Neřestí od Matyáše Bernarda Brauna, bylinkovou zahradou a vinařstvím.',
    photoUrl:
      'https://images.unsplash.com/photo-1568285564883-82084c718b5b?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Barokní skvost',
    highlight: 'UNESCO indikátor · Šporkův Kuks',
  },
  {
    id: 'place-tur-castolovice',
    name: 'Zámek Častolovice & Zámecký park',
    category: 'turistika',
    city: 'Rychnov nad Kněžnou',
    lat: 50.1305,
    lng: 16.1878,
    address: 'Masarykova 1, 517 50 Častolovice',
    description:
      'Renesanční zámek paní Diany Phipps Sternbergové s nádherným parkem, oborou s bílými daňky a zámeckou kavárnou.',
    photoUrl:
      'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Anglický park & Zvěřinec',
    highlight: 'Obora s daňky · Růžová zahrada',
  },
  {
    id: 'place-tur-prachovske-skaly',
    name: 'Prachovské skály (Český ráj)',
    category: 'turistika',
    city: 'Jičín',
    lat: 50.4682,
    lng: 15.2842,
    address: 'Prachov 37, 506 01 Holín',
    description:
      'Pískovcové skalní město s dechberoucími vyhlídkami Míru, Českého ráje a úzkými soutěskami pro pěší výpravy.',
    photoUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Skalní město',
    highlight: 'Vyhlídka Míru · Pískovce',
  },
  {
    id: 'place-tur-stezka-krkonose',
    name: 'Stezka korunami stromů Krkonoše',
    category: 'turistika',
    city: 'Janské Lázně',
    lat: 50.6318,
    lng: 15.7571,
    address: 'Krkonošská, 542 25 Janské Lázně',
    description:
      'Unikátní 45 metrů vysoká vyhlídková věž s podzemní expozicí kořenového systému a výhledy na Černou horu.',
    photoUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Výhled z koruny stromů',
    highlight: 'Krkonošský národní park (KRNAP)',
  },
  {
    id: 'place-tur-les-kralovstvi',
    name: 'Přehrada Les Království',
    category: 'turistika',
    city: 'Bílá Třemešná',
    lat: 50.4578,
    lng: 15.7686,
    address: 'Bílá Třemešná, 544 01 Dvůr Králové n. L.',
    description:
      'Pohádková přehradní hráz na Labi v pseudogotickém slohu s kamennými věžičkami a malebnou zalesněnou zátokou.',
    photoUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Pohádková hráz',
    highlight: 'Gotické věžičky · Labe',
  },
  {
    id: 'place-tur-opocno',
    name: 'Zámek Opočno & Letohrádek',
    category: 'turistika',
    city: 'Rychnov nad Kněžnou',
    lat: 50.2662,
    lng: 16.1154,
    address: 'Trčkovo náměstí 1, 517 73 Opočno',
    description:
      'Renesanční klenot s arkádovým nádvořím, rozsáhlou zbrojnicí a romantickým parkem v údolí Zlatého potoka.',
    photoUrl:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Renesanční arkády',
    highlight: 'Historická zbrojnice · Zlatý potok',
  },

  // ================= 4. HŘIŠTĚ, SPORTOVIŠTĚ A VOLNOČASOVÉ PARKY =================
  {
    id: 'place-hr-simkovy-sady',
    name: 'Volnočasový areál Šimkovy sady',
    category: 'hriste',
    city: 'Hradec Králové',
    lat: 50.2152,
    lng: 15.8378,
    address: 'Šimkovy sady, 500 03 Hradec Králové',
    description:
      'Oblíbený městský park s piknikovými loukami, rybníčky, workout hřištěm a grilovacími místy pro mládež i rodiny.',
    photoUrl:
      'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Workout & Piknik',
    highlight: 'Grilovací zóna · Městská zeleň',
  },
  {
    id: 'place-hr-pumptrack-trutnov',
    name: 'Pumptrack & Trailpark Bojiště',
    category: 'hriste',
    city: 'Trutnov',
    lat: 50.5482,
    lng: 15.9142,
    address: 'Králická, 541 01 Trutnov - Bojiště',
    description:
      'Asfaltový pumptrack a navazující bike traily v přírodním areálu Bojiště. Skvělé pro BMX, skate, in-line i trénink.',
    photoUrl:
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Pumptrack & MTB',
    highlight: 'Otevřeno zdarma · Trutnov Trails',
  },
  {
    id: 'place-hr-malsovice',
    name: 'Dopravní a sportovní park Malšovice',
    category: 'hriste',
    city: 'Hradec Králové',
    lat: 50.2035,
    lng: 15.8562,
    address: 'Kpt. Fechtnera, 500 09 Hradec Králové',
    description:
      'Multifunkční areál se skate překážkami, streetballovým kurtem a zázemím pro volnočasové sportovní aktivity.',
    photoUrl:
      'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Streetball & Skate',
    highlight: 'Osvětlený areál · Malšovice',
  },
  {
    id: 'place-hr-knize-jicin',
    name: 'Sportovně-rekreační areál Kníže',
    category: 'hriste',
    city: 'Jičín',
    lat: 50.4398,
    lng: 15.3582,
    address: 'Revoluční 1072, 506 01 Jičín',
    description:
      'Areál u rybníka Kníže s beachvolejbalovými kurty, inline dráhou a workoutovým hřištěm.',
    photoUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Beach & Inline',
    highlight: 'Rybník Kníže · Sportoviště',
  },
  {
    id: 'place-hr-zamek-nachod',
    name: 'Park a sportovní louka pod zámkem Náchod',
    category: 'hriste',
    city: 'Náchod',
    lat: 50.419,
    lng: 16.1605,
    address: 'Zámecká, 547 01 Náchod',
    description:
      'Zelené terasy a hřiště s výhledem na zámek a medvědí příkop, skvělé místo pro slackline, jógu a venkovní setkání.',
    photoUrl:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Podzámecký park',
    highlight: 'Zámecký medvědinec · Terasy',
  },

  // ================= 5. KULTURNÍ DOMY, DIVADLA A KONGRESOVÁ CENTRA (DATA KHK) =================
  {
    id: 'place-kd-aldis-hk',
    name: 'Kongresové centrum Aldis',
    category: 'kulturak',
    city: 'Hradec Králové',
    lat: 50.2154883,
    lng: 15.8290208,
    address: 'Eliščino nábřeží 375/1, 500 02 Hradec Králové',
    description:
      'Největší kongresové a společenské centrum v kraji. Velký sál pro 1 170 osob, Eliščin sál, výstavy, koncerty, plesy a festivaly.',
    capacity: 1170,
    accessibility: 'ANO',
    websiteUrl: 'https://www.aldis.cz/',
    tagLabel: 'Kapacita 1 170 míst',
    highlight: 'Kongresy & Velké plesy',
    photoUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-kraliky',
    name: 'Kulturní dům Králíky',
    category: 'kulturak',
    city: 'Králíky',
    lat: 50.2588167,
    lng: 15.5361486,
    address: 'Králíky 65, 504 01 Králíky',
    description:
      'Prostorný sál pro maturitní plesy, koncerty, taneční a sportovní soutěže s kapacitou až 1 000 osob.',
    capacity: 1000,
    accessibility: 'NE',
    websiteUrl: 'https://www.facebook.com/KulturnidumKraliky',
    tagLabel: 'Kapacita 1 000 míst',
    highlight: 'Maturitní plesy & Koncerty',
    photoUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-strelnice-hk',
    name: 'Kulturní dům Střelnice Hradec Králové',
    category: 'kulturak',
    city: 'Hradec Králové',
    lat: 50.2129728,
    lng: 15.8204094,
    address: 'Střelecká 45/2, 500 02 Hradec Králové',
    description:
      'Tradiční společenský dům pro plesy, taneční večery a koncerty (650 míst v přízemí a 250 na balkóně).',
    capacity: 900,
    accessibility: 'NE',
    websiteUrl: 'https://kd-strelnice.cz/',
    tagLabel: 'Kapacita 900 míst',
    highlight: 'Plesové sály & Koncerty',
    photoUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-jiraskovo-hronov',
    name: 'Jiráskovo divadlo a Sál Josefa Čapka',
    category: 'kulturak',
    city: 'Hronov',
    lat: 50.4802361,
    lng: 16.1830956,
    address: 'náměstí Čs. armády 500, 549 31 Hronov',
    description:
      'Domov proslulého festivalu Jiráskův Hronov. Divadelní představení, koncerty, plesy a společenská zasedání.',
    capacity: 850,
    accessibility: 'ANO',
    websiteUrl: 'https://kulturahronov.cz/',
    tagLabel: 'Kapacita 850 míst',
    highlight: 'Jiráskův Hronov & Divadlo',
    photoUrl:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-orlovna-rtyne',
    name: 'Multifunkční hala Orlovna Rtyně v Podkrkonoší',
    category: 'kulturak',
    city: 'Rtyně v Podkrkonoší',
    lat: 50.5052692,
    lng: 16.0684572,
    address: 'náměstí Horníků 856, 542 33 Rtyně v Podkrkonoší',
    description:
      'Multifunkční hala pro plesy, taneční soutěže, kulturní festivaly a společenské události.',
    capacity: 750,
    accessibility: 'ČÁSTEČNĚ',
    websiteUrl: 'http://www.orelrtyne.cz/',
    tagLabel: 'Kapacita 750 míst',
    highlight: 'Multifunkční hala & Plesy',
    photoUrl:
      'https://images.unsplash.com/photo-1519744647369-e8544ab69038?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-adalbertinum',
    name: 'Adalbertinum Hradec Králové',
    category: 'kulturak',
    city: 'Hradec Králové',
    lat: 50.2112056,
    lng: 15.8311492,
    address: 'Československé armády 300, 500 03 Hradec Králové',
    description:
      'Historické reprezentativní kulturní centrum v srdci města. Velký divadelní sál, Studio A, Bílý salónek a učebny.',
    capacity: 730,
    accessibility: 'ANO',
    websiteUrl: 'https://www.adalbertinum.cz/',
    tagLabel: 'Kapacita 730 míst',
    highlight: 'Kulturní centrum HK',
    photoUrl:
      'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-barchov',
    name: 'Kulturní dům Barchov',
    category: 'kulturak',
    city: 'Barchov',
    lat: 50.1995503,
    lng: 15.5712242,
    address: 'Barchov 92, 504 01 Barchov',
    description:
      'Velký společenský sál s foyer pro 600 osob a malý salónek. Ideální pro plesy, diskotéky a svatby.',
    capacity: 670,
    accessibility: 'ČÁSTEČNĚ',
    websiteUrl: 'https://www.facebook.com/kdbarchov/',
    tagLabel: 'Kapacita 670 míst',
    highlight: 'Společenský velkosál',
    photoUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-uffo-trutnov',
    name: 'UFFO - Společenské centrum Trutnovska',
    category: 'kulturak',
    city: 'Trutnov',
    lat: 50.5633817,
    lng: 15.9103336,
    address: 'náměstí Republiky 999, 541 01 Trutnov',
    description:
      'Špičkové multifunkční divadlo a kulturní centrum s unikátním variabilním prostorem, ozvučením L-Acoustics a festivaly nového cirkusu Cirk-UFF.',
    capacity: 640,
    accessibility: 'ANO',
    websiteUrl: 'http://uffo.cz/',
    tagLabel: 'Kapacita 640 míst',
    highlight: 'Stavba roku · Cirk-UFF',
    photoUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-jaromer',
    name: 'Městské kulturní středisko Jaroměř - Divadlo',
    category: 'kulturak',
    city: 'Jaroměř',
    lat: 50.3527486,
    lng: 15.9184078,
    address: 'náměstí Dukelských hrdinů 240, 551 01 Jaroměř',
    description:
      'Městské divadlo a kulturní dům s velkým sálem, balkonem a komorním sálem pro koncerty a besedy.',
    capacity: 555,
    accessibility: 'ANO',
    websiteUrl: 'http://www.divadlojaromer.cz',
    tagLabel: 'Kapacita 555 míst',
    highlight: 'Městské divadlo Jaroměř',
    photoUrl:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-masarykovo-jicin',
    name: 'Masarykovo divadlo Jičín',
    category: 'kulturak',
    city: 'Jičín',
    lat: 50.4357183,
    lng: 15.3580053,
    address: 'Husova 206, 506 01 Jičín',
    description:
      'Hlavní divadelní scéna Jičínska pro divadelní představení, koncerty, plesy a taneční přehlídky.',
    capacity: 520,
    accessibility: 'ANO',
    websiteUrl: 'https://kzmj.cz/',
    tagLabel: 'Kapacita 520 míst',
    highlight: 'Hlavní scéna Jičína',
    photoUrl:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-solnice',
    name: 'Společenský dům Solnice',
    category: 'kulturak',
    city: 'Solnice',
    lat: 50.2028314,
    lng: 16.2347136,
    address: 'Družstevní 555, 517 01 Solnice',
    description:
      'Moderní multifunkční sál pro plesy, koncerty, módní přehlídky a firemní konference u Rychnova.',
    capacity: 500,
    accessibility: 'ANO',
    websiteUrl: 'https://www.kulturasolnice.cz/',
    tagLabel: 'Kapacita 500 míst',
    highlight: 'Podorlické plesy & Koncerty',
    photoUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-beranek-nachod',
    name: 'Městské divadlo a hotel Beránek Náchod',
    category: 'kulturak',
    city: 'Náchod',
    lat: 50.4172214,
    lng: 16.1621136,
    address: 'Masarykovo náměstí 74, 547 01 Náchod',
    description:
      'Secesní klenot na Masarykově náměstí. Reprezentativní sál pro divadla, plesy, koncerty a kongresy.',
    capacity: 499,
    accessibility: 'ANO',
    websiteUrl: 'http://www.beraneknachod.cz/',
    tagLabel: 'Kapacita 499 míst',
    highlight: 'Secesní sál na náměstí',
    photoUrl:
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-nova-paka',
    name: 'Městské kulturní středisko Nová Paka',
    category: 'kulturak',
    city: 'Nová Paka',
    lat: 50.4951706,
    lng: 15.5137661,
    address: 'F. F. Procházky 101, 509 01 Nová Paka',
    description:
      'Kulturní centrum s divadelním sálem, výstavní síní a zázemím pro koncerty a přednášky.',
    capacity: 450,
    accessibility: 'ANO',
    websiteUrl: 'http://www.mks-novapaka.cz',
    tagLabel: 'Kapacita 450 míst',
    highlight: 'Divadelní sál & Výstavy',
    photoUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-koruna-horice',
    name: 'Dům kultury Koruna Hořice',
    category: 'kulturak',
    city: 'Hořice',
    lat: 50.3703275,
    lng: 15.6318775,
    address: 'Hálkova 105, 508 01 Hořice',
    description:
      'Kulturní dům v městě kamenné krásy. Sál pro plesy, ochotnická divadla, koncerty a loutkové hry.',
    capacity: 430,
    accessibility: 'ANO',
    websiteUrl: 'https://www.dum-kultury-koruna.cz/',
    tagLabel: 'Kapacita 430 míst',
    highlight: 'Hořická Koruna',
    photoUrl:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-hankuv-dum',
    name: 'Hankův dům Dvůr Králové nad Labem',
    category: 'kulturak',
    city: 'Dvůr Králové nad Labem',
    lat: 50.430985,
    lng: 15.8119211,
    address: 'náměstí Václava Hanky 299, 544 01 Dvůr Králové nad Labem',
    description:
      'Klasicistní městské kulturní zařízení s divadelním sálem pro koncerty KPH, plesy a taneční kurzy.',
    capacity: 420,
    accessibility: 'ČÁSTEČNĚ',
    websiteUrl: 'https://www.hankuv-dum.cz/',
    tagLabel: 'Kapacita 420 míst',
    highlight: 'Divadlo & KPH koncerty',
    photoUrl:
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-upice',
    name: 'Divadlo Aloise Jiráska Úpice',
    category: 'kulturak',
    city: 'Úpice',
    lat: 50.5115942,
    lng: 16.0155725,
    address: 'Chelčického 216, 542 32 Úpice',
    description:
      'Městské kulturní středisko s digitálním ozvučením Dolby Digital, kinem, divadlem a koncerty.',
    capacity: 400,
    accessibility: 'ANO',
    websiteUrl: 'https://www.mksu.cz/',
    tagLabel: 'Kapacita 400 míst',
    highlight: 'Divadlo & Kino Úpice',
    photoUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-sokolovna-vamberk',
    name: 'Městský klub Sokolovna Vamberk',
    category: 'kulturak',
    city: 'Vamberk',
    lat: 50.1159542,
    lng: 16.2911447,
    address: 'Tyršova 18, 517 54 Vamberk',
    description:
      'Divadelní sál a klub pro kurzy tance, plesy, výstavy krajek a divadelní inscenace.',
    capacity: 400,
    accessibility: 'ČÁSTEČNĚ',
    websiteUrl: 'https://vamberk.cz/',
    tagLabel: 'Kapacita 400 míst',
    highlight: 'Sokolovna Vamberk',
    photoUrl:
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-dvorana-smirice',
    name: 'Kulturní středisko Dvorana Smiřice',
    category: 'kulturak',
    city: 'Smiřice',
    lat: 50.3001856,
    lng: 15.8700861,
    address: 'Palackého 124, 503 03 Smiřice',
    description:
      'Prostorná Dvorana pro hudební zábavy, plesy, taneční soutěže a regionální veletrhy.',
    capacity: 370,
    accessibility: 'ANO',
    websiteUrl: 'https://www.mestosmirice.cz/kulturni-stredisko-dvorana/ds-1124',
    tagLabel: 'Kapacita 370 míst',
    highlight: 'Dvorana Smiřice',
    photoUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-trebechovice',
    name: 'Kulturní dům Třebechovice pod Orebem',
    category: 'kulturak',
    city: 'Třebechovice pod Orebem',
    lat: 50.1979114,
    lng: 15.9963214,
    address: 'Na Stavě 820, 503 46 Třebechovice pod Orebem',
    description:
      'Městský kulturní dům s pódiem pro divadla, koncerty a besedy u betlémářského města.',
    capacity: 350,
    accessibility: 'ANO',
    websiteUrl: 'https://kdtrebechovice.cz/',
    tagLabel: 'Kapacita 350 míst',
    highlight: 'Pod Orebem',
    photoUrl:
      'https://images.unsplash.com/photo-1497911270199-1c552ee64aa4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-pelclovo-rychnov',
    name: 'Pelclovo divadlo Rychnov nad Kněžnou',
    category: 'kulturak',
    city: 'Rychnov nad Kněžnou',
    lat: 50.1645194,
    lng: 16.2757011,
    address: 'Panská 79, 516 01 Rychnov nad Kněžnou',
    description:
      'Historická divadelní scéna pro profesionální i ochotnická představení, koncerty a taneční plesy.',
    capacity: 325,
    accessibility: 'ANO',
    websiteUrl: 'https://www.kulturark.cz/',
    tagLabel: 'Kapacita 325 míst',
    highlight: 'Pelclovo divadlo',
    photoUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-strelnice-vrchlabi',
    name: 'Kulturní dům Střelnice Vrchlabí',
    category: 'kulturak',
    city: 'Vrchlabí',
    lat: 50.6309958,
    lng: 15.6106494,
    address: 'Vančurova 378, 543 01 Vrchlabí',
    description:
      'Centrum krkonošské kultury v bráně Krkonoš. Divadelní sál, promítání filmů, koncerty a taneční kurzy.',
    capacity: 320,
    accessibility: 'ANO',
    websiteUrl: 'https://www.strelnicevrchlabi.cz/',
    tagLabel: 'Kapacita 320 míst',
    highlight: 'Brána Krkonoš',
    photoUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-zdarky',
    name: 'Kulturní dům Žďárky',
    category: 'kulturak',
    city: 'Žďárky',
    lat: 50.4671886,
    lng: 16.2291267,
    address: 'Žďárky 112, 549 37 Žďárky',
    description:
      'Kulturní a společenský sál pro plesy, hasičské zábavy a společenské akce u Hronova.',
    capacity: 320,
    accessibility: 'NE',
    websiteUrl: 'https://www.obeczdarky.cz/',
    tagLabel: 'Kapacita 320 míst',
    highlight: 'Podorlický kulturní dům',
    photoUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-nove-mesto',
    name: 'Městský klub Nové Město nad Metují',
    category: 'kulturak',
    city: 'Nové Město nad Metují',
    lat: 50.3520103,
    lng: 16.1491886,
    address: 'Boženy Němcové 720, 549 01 Nové Město nad Metují',
    description:
      'Městský klub pro divadla, filmové projekce, koncerty a festivalové přednášky.',
    capacity: 310,
    accessibility: 'ANO',
    websiteUrl: 'https://www.mestskyklub.cz/',
    tagLabel: 'Kapacita 310 míst',
    highlight: 'Městský klub',
    photoUrl:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-belohradska-sypka',
    name: 'Bělohradská sýpka Lázně Bělohrad',
    category: 'kulturak',
    city: 'Lázně Bělohrad',
    lat: 50.4309119,
    lng: 15.5794411,
    address: 'Štefánikova 643, 507 81 Lázně Bělohrad',
    description:
      'Citlivě zrekonstruovaná historická sýpka. Kavárna s terasou, galerie a velký společenský sál pro 300 osob.',
    capacity: 300,
    accessibility: 'ANO',
    websiteUrl: 'https://belohradskasypka.cz/',
    tagLabel: 'Kapacita 300 míst',
    highlight: 'Sýpka & Galerie & Kavárna',
    photoUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kd-pellyho-domy',
    name: 'Pellyho domy Police nad Metují',
    category: 'kulturak',
    city: 'Police nad Metují',
    lat: 50.5360789,
    lng: 16.2336975,
    address: 'Masarykovo náměstí 75, 549 54 Police nad Metují',
    description:
      'Centrum kultury, vzdělávání a sportu na náměstí. Koncerty, plesy, promítání, semináře a výstavy.',
    capacity: 300,
    accessibility: 'ANO',
    websiteUrl: 'https://www.pellyhodomy.cz/',
    tagLabel: 'Kapacita 300 míst',
    highlight: 'Centrum kultury Police',
    photoUrl:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&q=80',
  },

  // ================= 6. PŘÍRODA & HORY (NATURE & PEAKS) =================
  {
    id: 'place-nature-snezka',
    name: 'Sněžka (1 603 m n. m.) & Krkonošský národní park',
    category: 'priroda',
    city: 'Trutnov',
    lat: 50.736,
    lng: 15.7396,
    address: 'Krkonošský národní park, 542 21 Pec pod Sněžkou',
    description:
      'Nejvyšší hora České republiky s panoramatickým výhledem na Obří důl a Polsko. Ikonický cíl turistů i milovníků horských výšlapů.',
    photoUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    tagLabel: '1 603 m n. m.',
    highlight: 'KRNAP · Nejvyšší vrchol ČR',
    websiteUrl: 'https://www.krnap.cz/',
  },
  {
    id: 'place-nature-adrspach',
    name: 'Adršpašsko-teplické skály',
    category: 'priroda',
    city: 'Náchod',
    lat: 50.6139,
    lng: 16.1244,
    address: 'Dolní Adršpach 26, 549 57 Teplice nad Metují',
    description:
      'Fascinující skalní město z pískovcových věží, soutěsek, vodopádů a smaragdového zatopeného lomu. Přírodní rezervace evropského významu.',
    photoUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Skalní město',
    highlight: 'NPR Adršpach · Pískovcové věže',
    websiteUrl: 'https://www.skalyadrspach.cz/',
  },
  {
    id: 'place-nature-prachovske-skaly',
    name: 'Prachovské skály (Český ráj)',
    category: 'priroda',
    city: 'Jičín',
    lat: 50.4682,
    lng: 15.2863,
    address: 'Holín - Prachov 37, 506 01 Jičín',
    description:
      'Romantický labyrint skalních věží a vyhlídek s výhledy na Jinolické rybníky a Český ráj. Skvělé místo pro komunitní výlety.',
    photoUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Český ráj',
    highlight: 'Přírodní rezervace · Vyhlídka Míru',
    websiteUrl: 'https://www.prachovskeskaly.com/',
  },
  {
    id: 'place-nature-babiccino-udoli',
    name: 'Babiččino údolí & Viktoriin splav',
    category: 'priroda',
    city: 'Náchod',
    lat: 50.4285,
    lng: 16.0505,
    address: 'Ratibořice 1, 552 03 Česká Skalice',
    description:
      'Malebné údolí řeky Úpy proslavené románem Boženy Němcové. Zámek Ratibořice, Staré bělidlo, romantický splav a stinné stezky.',
    photoUrl:
      'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Údolí řeky Úpy',
    highlight: 'NPP Babiččino údolí · Naučná stezka',
    websiteUrl: 'https://www.zamek-ratiborice.cz/',
  },
  {
    id: 'place-nature-velka-destna',
    name: 'Velká Deštná & Rozhledna (1 115 m n. m.)',
    category: 'priroda',
    city: 'Rychnov nad Kněžnou',
    lat: 50.3013,
    lng: 16.3986,
    address: 'CHKO Orlické hory, 517 91 Deštné v Orlických horách',
    description:
      'Nejvyšší bod Orlických hor s moderní architektonickou rozhlednou s výhledem na Krkonoše, Bystřické hory i Kralický Sněžník.',
    photoUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    tagLabel: 'Orlické hory',
    highlight: 'Architektonická rozhledna · 1 115 m',
  },

  // ================= 7. KINA (CINEMAS) =================
  {
    id: 'place-kino-bio-central',
    name: 'Bio Central Hradec Králové',
    category: 'kino',
    city: 'Hradec Králové',
    lat: 50.2117,
    lng: 15.8242,
    address: 'Karla Čapka 847/5, 500 02 Hradec Králové',
    description:
      'Kultovní artové kino s barem, dvorkem pro letní promítání, filmovými kluby a komunitními debatami.',
    capacity: 384,
    accessibility: 'ANO',
    websiteUrl: 'https://www.biocentral.cz/',
    tagLabel: 'Artové kino & Bar',
    highlight: 'Bio Central · Filmový klub',
    photoUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kino-vesmir-trutnov',
    name: 'Kino Vesmír Trutnov',
    category: 'kino',
    city: 'Trutnov',
    lat: 50.5629,
    lng: 15.9083,
    address: 'Nábřeží Václava Havla 19, 541 01 Trutnov',
    description:
      'Moderní městské digitální kino na nábřeží řeky Úpy. Projekce premiér, festivalové cykly a filmový klub.',
    capacity: 220,
    accessibility: 'ANO',
    websiteUrl: 'https://www.uffo.cz/kino-vesmir/',
    tagLabel: 'Digitální kino',
    highlight: 'Kino Vesmír · Nábřeží Úpy',
    photoUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kino-cesky-raj-jicin',
    name: 'Biograf Český ráj Jičín',
    category: 'kino',
    city: 'Jičín',
    lat: 50.4379,
    lng: 15.3524,
    address: '17. listopadu 47, 506 01 Jičín',
    description:
      'Tradiční jičínský biograf v centru města s moderním ozvučením, kavárenským zázemím a přehlídkami světové kinematografie.',
    capacity: 250,
    accessibility: 'ANO',
    websiteUrl: 'https://www.kzmj.cz/biograf-cesky-raj/',
    tagLabel: 'Historický biograf',
    highlight: 'Biograf Český ráj · Centrum',
    photoUrl:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kino-70-nove-mesto',
    name: 'Kino 70 Nové Město nad Metují',
    category: 'kino',
    city: 'Nové Město nad Metují',
    lat: 50.3475,
    lng: 16.1558,
    address: 'Čs. odboje 520, 549 01 Nové Město nad Metují',
    description:
      'Domovské kino Novoměstského hrnce smíchu – prestižního festivalu české filmové komedie. Špičková projekční technika.',
    capacity: 350,
    accessibility: 'ANO',
    websiteUrl: 'https://www.kino70.cz/',
    tagLabel: 'Festivalové kino',
    highlight: 'Hrnec smíchu · Špičkový zvuk',
    photoUrl:
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'place-kino-rychnov',
    name: 'Kino Rychnov nad Kněžnou',
    category: 'kino',
    city: 'Rychnov nad Kněžnou',
    lat: 50.1624,
    lng: 16.275,
    address: 'Panská 79, 516 01 Rychnov nad Kněžnou',
    description:
      'Oblíbené podorlické kino u zámeckého parku nabízející premiérové i artové snímky pro všechny generace.',
    capacity: 180,
    accessibility: 'ANO',
    websiteUrl: 'https://www.kultura-rk.cz/',
    tagLabel: 'Podorlické kino',
    highlight: 'U Zámeckého parku · Rychnov',
    photoUrl:
      'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=80',
  },
];
