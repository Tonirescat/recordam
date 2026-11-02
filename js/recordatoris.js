// recordatoris.js — Calcula quan passa cada cosa i quan s'ha d'avisar.
// No guarda res: tot es calcula a partir dels registres de dades.js.
//
// Una «ocurrència» és cada vegada que passa una cosa. Per exemple, un medicament
// de cada dia a les 9:00 té una ocurrència cada dia a les 9:00.

const CATEGORIES = {
  med:    { col: 'medicaments', ruta: 'medicacio', icona: 'pastilla', nom: 'cat_med' },
  cites:  { col: 'cites',       ruta: 'cites',     icona: 'cita',     nom: 'cat_cites' },
  act:    { col: 'activitats',  ruta: 'activitat', icona: 'caminar',  nom: 'cat_act' },
  agenda: { col: 'agenda',      ruta: 'agenda',    icona: 'llibreta', nom: 'cat_agenda' },
};

// Opcions d'antelació de l'avís (en minuts) per a cada categoria. El primer valor és el que surt marcat.
const ANTELACIONS = {
  cites: [1440, 120, 60],
  act: [30, 0, 15, 60],
  agenda: [60, 0, 15, 1440],
};

function titolDe(cat, r) { return cat === 'cites' ? r.motiu : r.nom; }

// Retorna totes les ocurrències entre dues dates (objectes Date), ordenades.
function ocurrencies(dades, desde, fins) {
  const llista = [];
  const diaInici = dataISO(desde);
  const diaFi = dataISO(fins);

  function afegir(cat, r, data, hora) {
    const quan = crearData(data, hora);
    if (quan < desde || quan > fins) return;
    const minuts = cat === 'med' ? 0 : (r.antelacio || 0);
    llista.push({
      cat: cat, id: r.id, registre: r, titol: titolDe(cat, r),
      data: data, hora: hora, quan: quan,
      avisActiu: !!r.avis, antelacio: minuts,
      avisQuan: r.avis ? new Date(quan.getTime() - minuts * 60000) : null,
      clau: cat + '|' + r.id + '|' + data + '|' + hora,
    });
  }

  // Medicació: cada dia (o els dies triats) entre la data d'inici i la de final.
  dades.medicaments.forEach(function (m) {
    let dia = m.inici > diaInici ? m.inici : diaInici;
    const ultim = m.fi && m.fi < diaFi ? m.fi : diaFi;
    for (let n = 0; dia <= ultim && n < 400; n++, dia = sumarDies(dia, 1)) {
      const diaSetmana = crearData(dia, '12:00').getDay();
      if (m.freq === 'dies' && m.dies.indexOf(diaSetmana) === -1) continue;
      m.hores.forEach(function (h) { afegir('med', m, dia, h); });
    }
  });

  // Cites: un sol cop.
  dades.cites.forEach(function (c) { afegir('cites', c, c.data, c.hora); });

  // Activitats i agenda: un cop, cada dia o cada setmana a partir de la data indicada.
  [['act', dades.activitats], ['agenda', dades.agenda]].forEach(function (parella) {
    const cat = parella[0];
    parella[1].forEach(function (r) {
      if (r.rep === 'un' || !r.rep) { afegir(cat, r, r.data, r.hora); return; }
      if (r.rep === 'dies') {
        // Els dies de la setmana triats, a partir de la data indicada.
        let d = r.data > diaInici ? r.data : diaInici;
        for (let n = 0; d <= diaFi && n < 400; n++, d = sumarDies(d, 1)) {
          if ((r.dies || []).indexOf(crearData(d, '12:00').getDay()) > -1) afegir(cat, r, d, r.hora);
        }
        return;
      }
      const pas = r.rep === 'diari' ? 1 : 7;
      let dia = r.data;
      if (dia < diaInici) {
        const salts = Math.floor(diesEntre(dia, diaInici) / pas);
        dia = sumarDies(dia, salts * pas);
      }
      for (let n = 0; dia <= diaFi && n < 400; n++, dia = sumarDies(dia, pas)) afegir(cat, r, dia, r.hora);
    });
  });

  llista.sort(function (a, b) { return a.quan - b.quan; });
  return llista;
}

// Propers recordatoris: coses que encara no han passat i que tenen l'avís activat.
function propersRecordatoris(dades, ara, dies, maxim) {
  const fins = new Date(ara.getTime() + dies * 86400000);
  const llista = ocurrencies(dades, ara, fins).filter(function (o) { return o.avisActiu; });
  return maxim ? llista.slice(0, maxim) : llista;
}

// Avisos que s'han de mostrar perquè la seva hora d'avís ha arribat entre «de» i «a».
function avisosVencuts(dades, de, a) {
  const fins = new Date(a.getTime() + 2 * 86400000); // l'avís pot ser fins a 1 dia abans
  return ocurrencies(dades, de, fins).filter(function (o) {
    return o.avisActiu && o.avisQuan > de && o.avisQuan <= a;
  });
}

// Primer avís que rebrà un registre a partir d'ara (per al missatge de confirmació).
function primerAvis(dades, cat, id, ara) {
  const fins = new Date(ara.getTime() + 400 * 86400000);
  const totes = ocurrencies(dades, ara, fins);
  for (let i = 0; i < totes.length; i++) {
    const o = totes[i];
    if (o.cat === cat && o.id === id && o.avisActiu && o.avisQuan > ara) return o;
  }
  return null;
}

// Propera ocurrència d'un registre (encara que no tingui avís).
function properaVegada(dades, cat, id, ara) {
  const fins = new Date(ara.getTime() + 400 * 86400000);
  const totes = ocurrencies(dades, ara, fins);
  for (let i = 0; i < totes.length; i++) if (totes[i].cat === cat && totes[i].id === id) return totes[i];
  return null;
}

function buscarOcurrencia(dades, clau) {
  if (!clau) return null;
  const parts = clau.split('|');
  const ara = new Date();
  const desde = crearData(parts[2] || avuiISO(), '00:00');
  const fins = crearData(parts[2] || avuiISO(), '23:59');
  if (isNaN(desde)) return null;
  const totes = ocurrencies(dades, desde < ara ? desde : desde, fins);
  for (let i = 0; i < totes.length; i++) if (totes[i].clau === clau) return totes[i];
  return null;
}
