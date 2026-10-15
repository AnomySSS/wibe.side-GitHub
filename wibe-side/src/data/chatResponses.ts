import { UserProfile } from '../types';

// Track recent response indices per friend to avoid repeating the same reply
const recentResponseIndices: Record<string, number> = {};

function pickNextResponse(friendId: string, options: string[]): string {
  if (options.length === 1) return options[0];
  const lastIdx = recentResponseIndices[friendId] ?? -1;
  let nextIdx = Math.floor(Math.random() * options.length);
  if (nextIdx === lastIdx) {
    nextIdx = (nextIdx + 1) % options.length;
  }
  recentResponseIndices[friendId] = nextIdx;
  return options[nextIdx];
}

export function generateRealisticReply(
  friend: UserProfile,
  incomingText: string
): { text: string; delayMs: number } {
  const lower = incomingText.trim().toLowerCase();
  const firstName = friend.realName.split(' ')[0] || friend.nickname;
  const isQuestion = lower.includes('?');

  // Realistic human reading + typing delay (1400ms - 2200ms)
  const baseDelay = 1400;
  const jitter = Math.floor(Math.random() * 800);
  const delayMs = baseDelay + jitter;

  // 1. Klára Novotná (Hradec Králové, Káva, filtry, pečení)
  if (friend.id === 'user-klara') {
    if (lower.includes('ahoj') || lower.includes('čau') || lower.includes('cau') || lower.includes('zdar')) {
      const replies = [
        'Ahoj! Zrovna balím termosky a mlýnek na kávu. Jak se máš?',
        'Ahojky! Dneska je v Hradci nádherně na posezení venku ☀️',
        'Čauvec! Akorát přemýšlím, jestli dneska vezmu na filtr Keňu nebo Kolumbii ☕',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('kdy') || lower.includes('čas') || lower.includes('hodin') || lower.includes('stíháš')) {
      const replies = [
        'Já už tam budu kolem půl čtvrté, abych chytila dobrý stůl v podloubí na Velkém náměstí.',
        'Za 20 minut jsem na místě! Počkej na mě u kašny, poznáš mě podle žlutého batohu.',
        'Stíhám to na pohodu, dorazím přesně v domluvený čas.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('káv') || lower.includes('kafe') || lower.includes('filtr') || lower.includes('čaj') || lower.includes('jídlo') || lower.includes('šnek')) {
      const replies = [
        'Mám s sebou čerstvě upraženou Etiopii a ještě horké skořicové šneky z rána! Bude to pecka ☕🥐',
        'Určitě dáme V60 filtr! Voda už je nachystaná, těš se.',
        'Skvělý, vezmu i kelímky navíc, kdyby se přidal ještě někdo další z party.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('super') || lower.includes('díky') || lower.includes('platí') || lower.includes('parád') || lower.includes('peck') || lower.includes('jasně')) {
      const replies = [
        'Paráda! Moc se těším, až probereme srazy na příští týden 🙌',
        'Super, platí! Píšu si to a vidíme se na náměstí.',
        'Bezva, měj se zatím krásně a za chvíli ahoj! 😊',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (isQuestion) {
      const replies = [
        'Jasně, to zvládneme bez problému! Místa je dost a zahrádka je otevřená.',
        'Určitě jo! Už jsem psala i ostatním, sejdeme se tam v plné sestavě.',
        'Dobrá otázka – myslím, že kolem čtvrté je to úplně ideální čas.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    // Default pool for Klára
    const defaults = [
      'Skvělý nápad! Zrovna jsem koukala na mapu událostí a v HK to dneska žije.',
      'Díky za zprávu! Počítám s tebou na srazu u kašny na Velkém náměstí ☕',
      'Uvidíme se tam! Vezmu s sebou ještě vzorky výběrové kávy na ochutnávku.',
      'Paráda, těším se! Dej vědět, až budeš na cestě.',
    ];
    return { text: pickNextResponse(friend.id, defaults), delayMs };
  }

  // 2. Tomáš Dvořák (Trutnov, Hory, Trailový běh, Bojiště)
  if (friend.id === 'user-tomas') {
    if (lower.includes('ahoj') || lower.includes('čau') || lower.includes('cau') || lower.includes('zdar')) {
      const replies = [
        'Čau Matěji! Jak to jde? Já právě kontroluju trasu na Bojišti v Trutnově 🌲',
        'Zdar borče! Zrovna jsem dotáhl strečink po ranním výběhu.',
        'Ahoj! V Trutnově je dneska čistý vzduch a ideální podmínky na výběh.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('kdy') || lower.includes('čas') || lower.includes('stíháš') || lower.includes('tempo')) {
      const replies = [
        'Vyrazíme v 17:00 od amfiteátru Bojiště. Dáme klidné tempo kolem 5:30/km, žádný stres 🏃',
        'Počítám se srazem za půl hodiny u vstupu do lesoparku. Stíháš v klidu?',
        'Zítra ráno v 9:00 na náměstí v Trutnově, ať stihneme hřebeny před poledním teplem.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('bota') || lower.includes('boty') || lower.includes('trailov') || lower.includes('počas') || lower.includes('déšť') || lower.includes('mokro')) {
      const replies = [
        'Vezmi trailovky s hrubším vzorkem, nahoře na kořenech to po včerejším dešti trochu klouže 👟',
        'V lese je sucho, takže stačí klasické silničky nebo lehké boty na lesní šotolinu.',
        'Nezapomeň lahev s ionťákem a lehkou větrovku, na hřebeni může foukat.',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('super') || lower.includes('platí') || lower.includes('parád') || lower.includes('díky')) {
      const replies = [
        'Platí! Dneska to pořádně rozběháme, uvidíš ten výhled na Krkonoše z vrchu! 💪',
        'Skvělá domluva! Po běhu můžeme dát protein nebo limču v bistru.',
        'Paráda, těším se na společný trénink!',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    const defaults = [
      'Zní to jako dobrý plán! Horský vzduch v Krkonoších člověka vždycky nabije energií.',
      'Super, vezmu i GPS hodinky, ať změříme převýšení a trasu pro celou partu.',
      'Jasná věc, počítám s tebou! Trutnovská parta už je taky natěšená.',
    ];
    return { text: pickNextResponse(friend.id, defaults), delayMs };
  }

  // 3. Viktorie Malá (HK, Skate, Pumptrack, Fotky)
  if (friend.id === 'user-viky') {
    if (lower.includes('ahoj') || lower.includes('čau') || lower.includes('cau') || lower.includes('zdar')) {
      const replies = [
        'Čauvec! Pumptrack v Malšovicích je dneska úplně boží, akorát zapínám reprák 🛹',
        'Ahoj! Zrovna dofukuju kola a balím foťák. Stavíš se?',
        'Čau! Dneska máme v plánu grindovat až do soumraku 🤙',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('skate') || lower.includes('prkno') || lower.includes('pumptrack') || lower.includes('hudba') || lower.includes('trik')) {
      const replies = [
        'Mám sestavený novej drum&bass playlist a povrch na pumptracku je mega rychlej!',
        'Jasně, ber prkno nebo scooter! Zkoušíme dneska kickflipy a ollie přes překážku.',
        'Mám s sebou i zrcadlovku s rybím okem, můžu tě natočit v akci na IG reel 📸',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    const defaults = [
      'Yesss! To beru všema deseti. Sejdeme se u U-rampy v Malšovicích.',
      'Pecka! Dáme pár kol a pak skočíme na ledovou tříšť kousek od stadionu.',
      'Mám to v plánu! Dorazím hned, jak sbalím vercajk na prkno.',
    ];
    return { text: pickNextResponse(friend.id, defaults), delayMs };
  }

  // 4. Anežka Horáková (Náchod, Vinyl, Terasa, Zámek)
  if (friend.id === 'user-anezka') {
    if (lower.includes('ahoj') || lower.includes('čau') || lower.includes('cau')) {
      const replies = [
        'Ahoj! Na terase pod náchodským zámkem je dneska magické světlo 🌇',
        'Čauky! Zrovna vybírám desky na večerní poslech, jak se máš?',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    if (lower.includes('hudb') || lower.includes('deska') || lower.includes('vinyl') || lower.includes('večer') || lower.includes('náchod')) {
      const replies = [
        'Mám připravený analogový jazz-hop a starý československý synth-pop, bude to nádhera 🎶',
        'Na terase v Náchodě už chladíme domácí limonádu, přijďte klidně dřív!',
        'Skvělý, vezmi klidně své oblíbené LP desky, můžeme je pustit!',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    const defaults = [
      'Díky za zprávu! V Náchodě pod zámkem jste kdykoliv vítáni, těším se na pokec 🎧',
      'Paráda, domluveno! Už se těším na západ slunce s hudbou.',
    ];
    return { text: pickNextResponse(friend.id, defaults), delayMs };
  }

  // 5. Samuel Urban (Jičín, Deskovky, Gaming)
  if (friend.id === 'user-sam') {
    if (lower.includes('hra') || lower.includes('deskov') || lower.includes('turnaj') || lower.includes('lan')) {
      const replies = [
        'Mám sbalený Mars, Osadníky i rychlé párty hry! Kdo se přidá do týmu? 🎲',
        'Večer rozjíždíme lobby ve Valorantu, tak doufám, že zapneš Discord!',
      ];
      return { text: pickNextResponse(friend.id, replies), delayMs };
    }
    const defaults = [
      'Čauvec! V Jičíně v zámeckém parku je dneska super stín na hry, stav se!',
      'Pecka, beru tě do party! Za půl hodinky se sejdeme u fontány.',
    ];
    return { text: pickNextResponse(friend.id, defaults), delayMs };
  }

  // 6. Generic response tailored to any user
  if (lower.includes('ahoj') || lower.includes('čau') || lower.includes('cau') || lower.includes('zdar')) {
    const replies = [
      `Ahoj! Rád/a tě slyším. Jak to dneska vidíš se srazy v ${friend.city}?`,
      `Čauvec! Zrovna koukám do aplikace na srazy v okolí. Jak se máš?`,
      `Ahoj! Děkuju za zprávu, rád/a tě poznávám 😊`,
    ];
    return { text: pickNextResponse(friend.id, replies), delayMs };
  }

  if (lower.includes('kdy') || lower.includes('kde') || lower.includes('čas')) {
    const replies = [
      `Vyhovuje mi to dneska odpoledne v ${friend.city}. Kde přesně by se ti to hodilo?`,
      `Já stíhám kdykoliv po 16:00! Můžeme se potkat na obvyklém místě.`,
      `Klidně dorazím za 20 minut, jen co dopiju čaj a vyrazím.`,
    ];
    return { text: pickNextResponse(friend.id, replies), delayMs };
  }

  if (lower.includes('super') || lower.includes('díky') || lower.includes('platí') || lower.includes('parád')) {
    const replies = [
      `Platí! Moc rád/a tě uvidím naživo na srazu 🙌`,
      `Super, domluveno! Napíšeme si, až budeme na místě.`,
      `Paráda, těším se! Měj zatím hezký den.`,
    ];
    return { text: pickNextResponse(friend.id, replies), delayMs };
  }

  const genericReplies = [
    `Díky za zprávu! V ${friend.city} je dneska fajn den, rád/a se potkám na nějaké akci z mapy.`,
    `Ahoj, určitě! Píšu si to a počítám s tím. Ozvi se, až dorazíš na místo!`,
    `Super zpráva! Zrovna jsem o tom přemýšlel/a. Uvidíme se tam!`,
    `Jasně, domluveno! Dej vědět, kdyby se cokoliv změnilo 😊`,
  ];
  return { text: pickNextResponse(friend.id, genericReplies), delayMs };
}
