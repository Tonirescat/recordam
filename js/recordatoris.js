// recordatoris.js — Calcula quan passa cada cosa i quan s'ha d'avisar.
// No guarda res: tot es calcula a partir dels registres de dades.js.
//
// Una «ocurrència» és cada vegada que passa una cosa. Per exemple, un medicament
// de cada dia al matí té una ocurrència cada dia, en el moment «matí».
//
// Medicació i exercicis van per MOMENTS del dia (matí, migdia, nit).
// Cites i agenda van per DIA I HORA.
// Els avisos són automàtics (la persona no els configura):
//   - Medicació i exercicis: a l'hora «d'avís» del seu moment del dia.
//   - Cites: 1 dia abans, a la mateixa hora.
//   - Agenda: 1 hora abans.

const CATEGORIES = {
  med:    { col: 'medicaments', ruta: 'medicacio', icona: 'pastilla', nom: 'cat_med',    moments: true },
  cites:  { col: 'cites',       ruta: 'cites',     icona: 'cita',     nom: 'cat_cites' },
  act:    { col: 'activitats',  ruta: 'activitat', icona: 'caminar',  nom: 'cat_act',    moments: true },
  agenda: { col: 'agenda',      ruta: 'agenda',    icona: 'llibreta', nom: 'cat_agenda' },
};

// Moments del dia. «avis»: hora en què surt l'avís. «venc»: a partir d'aquesta hora, si no s'ha fet,
// surt la franja vermella «Ha passat l'hora!».
const ORDRE_MOMENTS = ['mati', 'migdia', 'nit'];
const MOMENTS = {
  mati:   { avis: '09:00', venc: '13:00', icona: 'alba' },
  migdia: { avis: '14:00', venc: '17:00', icona: 'sol' },
  nit:    { avis: '21:00', venc: '23:00', icona: 'lluna' },
};

// Minuts d'antelació de l'avís (fixos).
const ANTELACIO_FIXA = { med: 0, act: 0, cites: 1440, agenda: 60 };

function titolDe(cat, r) { return cat === 'cites' ? r.motiu : r.nom; }

function ultimDiaDelMes(iso) {
  const [a, m] = iso.split('-').map(Number);
  return new Date(a, m, 0).getDate();
}

// Diu si un registre «cau» en un dia concret. Serveix per a medicació, exercicis i agenda.
function cauEnDia(r, dia) {
  const diaSet = crearData(dia, '12:00').getDay();
  const freq = r.freq || r.rep || 'un';
  const primer = r.data || ''; // l'agenda comença el dia indicat
  if (primer && dia < primer) return false;
  if (freq === 'un' || freq === 'unic') return dia === r.data;
  if (freq === 'diari') return true;
  if (freq === 'dies') return (r.dies || []).indexOf(diaSet) > -1;
  if (freq === 'setmanal2' || freq === 'setmanal3') {
    // Cada 2 o 3 setmanes: a partir de la primera vegada (r.ancora), el mateix dia de la setmana.
    if (!r.ancora || dia < r.ancora) return false;
    return diesEntre(r.ancora, dia) % (7 * (freq === 'setmanal2' ? 2 : 3)) === 0;
  }
  if (freq === 'setmanal') {
    const objectiu = r.diaSetmana != null ? r.diaSetmana : crearData(r.data, '12:00').getDay();
    return diaSet === objectiu;
  }
  if (freq === 'mensual') {
    const objectiu = r.diaMes != null ? r.diaMes : Number(r.data.slice(8, 10));
    // Si el mes és més curt (per exemple, 31 al febrer), es compta l'últim dia del mes.
    return Number(dia.slice(8, 10)) === Math.min(objectiu, ultimDiaDelMes(dia));
  }
  return false;
}

// Retorna totes les ocurrències entre dues dates (objectes Date), ordenades.
function ocurrencies(dades, desde, fins) {
  const llista = [];
  const diaInici = dataISO(desde);
  const diaFi = dataISO(fins);

  function afegir(cat, r, data, moment, hora, venc) {
    const quan = crearData(data, hora);
    if (quan < desde || quan > fins) return;
    const clau = cat + '|' + r.id + '|' + data + '|' + (moment || hora);
    let vencDate = crearData(data, venc || hora);
    // Medicació i exercicis: no es compta cap dia anterior al dia en què es va apuntar la cosa.
    // Els moments d'aquell mateix dia que ja havien passat SÍ que surten (perquè es vegi on s'ha afegit),
    // però sense la franja vermella de «Ha passat l'hora!» (no és un retard de la persona).
    if (r.creat) {
      if (data < r.creat.slice(0, 10)) return;
      if (vencDate <= crearData(r.creat.slice(0, 10), r.creat.slice(11) || '00:00')) vencDate = crearData(data, '23:59');
    }
    const descartada = !!(dades.descartats && dades.descartats[clau]);
    const minuts = ANTELACIO_FIXA[cat] || 0;
    llista.push({
      cat: cat, id: r.id, registre: r, titol: titolDe(cat, r),
      data: data, hora: hora, moment: moment || '', quan: quan, venc: vencDate,
      descartada: descartada,
      avisActiu: !descartada, antelacio: minuts,
      avisQuan: descartada ? null : new Date(quan.getTime() - minuts * 60000),
      clau: clau,
    });
  }

  // Medicació i exercicis: per moments del dia.
  [['med', dades.medicaments], ['act', dades.activitats]].forEach(function (parella) {
    const cat = parella[0];
    parella[1].forEach(function (r) {
      let dia = diaInici;
      for (let n = 0; dia <= diaFi && n < 400; n++, dia = sumarDies(dia, 1)) {
        if (!cauEnDia(r, dia)) continue;
        (r.moments || []).forEach(function (m) {
          if (MOMENTS[m]) afegir(cat, r, dia, m, MOMENTS[m].avis, MOMENTS[m].venc);
        });
      }
    });
  });

  // Cites: un sol cop.
  dades.cites.forEach(function (c) { afegir('cites', c, c.data, '', c.hora); });

  // Agenda: un cop o repetida (cada dia, setmana, mes o alguns dies), a partir de la data indicada.
  dades.agenda.forEach(function (r) {
    if (!r.rep || r.rep === 'un') { afegir('agenda', r, r.data, '', r.hora); return; }
    let dia = diaInici > r.data ? diaInici : r.data;
    for (let n = 0; dia <= diaFi && n < 400; n++, dia = sumarDies(dia, 1)) {
      if (cauEnDia(r, dia)) afegir('agenda', r, dia, '', r.hora);
    }
  });

  llista.sort(function (a, b) {
    return (a.quan - b.quan) || (ORDRE_MOMENTS.indexOf(a.moment) - ORDRE_MOMENTS.indexOf(b.moment)) || a.titol.localeCompare(b.titol);
  });
  return llista;
}

// Ocurrències d'un dia d'una categoria (inclou les descartades només si «ambDescartades»).
function ocurrenciesDelDia(dades, cat, dia, ambDescartades) {
  return ocurrencies(dades, crearData(dia, '00:00'), crearData(dia, '23:59')).filter(function (o) {
    return o.cat === cat && (ambDescartades || !o.descartada);
  });
}

// Properes tasques: només cites i agenda, des de l'inici d'avui fins al final del dia número «dies»
// (2 dies = avui i demà). Inclou el que ja s'ha fet i el que ja ha passat d'hora avui sense fer-se,
// perquè la persona ho vegi i ho pugui marcar.
function tasquesProperes(dades, ara, dies) {
  const avui = dataISO(ara);
  const desde = crearData(avui, '00:00');
  const fins = crearData(sumarDies(avui, dies - 1), '23:59');
  return ocurrencies(dades, desde, fins).filter(function (o) {
    return (o.cat === 'cites' || o.cat === 'agenda') && o.avisActiu;
  });
}

// Avisos que s'han de mostrar perquè la seva hora d'avís ha arribat entre «de» i «a».
function avisosVencuts(dades, de, a) {
  const fins = new Date(a.getTime() + 2 * 86400000); // l'avís pot ser fins a 1 dia abans
  return ocurrencies(dades, de, fins).filter(function (o) {
    return o.avisActiu && !(dades.preses && dades.preses[o.clau]) && o.avisQuan > de && o.avisQuan <= a;
  });
}

// Propera ocurrència d'una categoria a partir d'ara (la propera cita, la propera cosa de l'agenda...).
function properaDeCategoria(dades, cat, ara) {
  const fins = new Date(ara.getTime() + 400 * 86400000);
  const totes = ocurrencies(dades, ara, fins);
  for (let i = 0; i < totes.length; i++) {
    if (totes[i].cat === cat && !(cat === 'cites' && totes[i].descartada)) return totes[i]; // una cita treta de la llista ja no és «la propera»
  }
  return null;
}

// Propera ocurrència d'un registre concret.
function properaVegada(dades, cat, id, ara) {
  const fins = new Date(ara.getTime() + 400 * 86400000);
  const totes = ocurrencies(dades, ara, fins);
  for (let i = 0; i < totes.length; i++) if (totes[i].cat === cat && totes[i].id === id) return totes[i];
  return null;
}

function buscarOcurrencia(dades, clau) {
  if (!clau) return null;
  const dia = clau.split('|')[2] || avuiISO();
  if (!esDataValida(dia)) return null;
  const totes = ocurrencies(dades, crearData(dia, '00:00'), crearData(dia, '23:59'));
  for (let i = 0; i < totes.length; i++) if (totes[i].clau === clau) return totes[i];
  return null;
}

// Propers avisos de qualsevol categoria (ho fa servir la pàgina dels investigadors per programar un avís de prova).
function propersRecordatoris(dades, ara, dies, maxim) {
  const fins = new Date(ara.getTime() + dies * 86400000);
  const llista = ocurrencies(dades, ara, fins).filter(function (o) { return o.avisActiu; });
  return maxim ? llista.slice(0, maxim) : llista;
}
