// dades.js — L'únic fitxer que llegeix i guarda les dades.
// Les dades es guarden al navegador del dispositiu (localStorage), mai en un servidor.
// Cada dispositiu i cada navegador té les seves pròpies dades.

const CLAU_DADES = 'recordam.v1';   // on es guarden els registres i els ajustos
const CLAU_DEMO = 'recordam.demo';  // avís de prova programat pels investigadors

let emmagatzematgeDisponible = true;
let copiaEnMemoria = null; // només s'utilitza si el navegador no deixa guardar

function dadesBuides() {
  return {
    versio: 2,
    medicaments: [], // { id, nom, dosi, moments:['mati','migdia','nit'], freq, dies, diaSetmana, diaMes, creat }
    cites: [],       // { id, motiu, data, hora, obs }
    activitats: [],  // { id, nom, durada, moments, freq, dies, diaSetmana, diaMes, creat }
    agenda: [],      // { id, nom, data, hora, notes, rep, dies }
    preses: {},      // coses fetes: { "cat|id|AAAA-MM-DD|moment o HH:MM": true }
    descartats: {},  // coses tretes de la llista només d'aquesta vegada: { "cat|id|AAAA-MM-DD|moment o HH:MM": true }
    ajustos: { idioma: 'ca', mida: 'normal', tema: 'clar' }, // tema: 'clar' o 'fosc'
  };
}

// ---------- Canvi de versió de les dades ----------
// Versió 2: medicació i exercicis van per moments del dia (matí, migdia, nit) i no per hores,
// no tenen data d'inici ni de final, i els avisos són automàtics (ja no hi ha l'opció d'avís).
function momentDeHora(h) {
  const n = Number(String(h || '12:00').slice(0, 2));
  return n < 12 ? 'mati' : (n < 18 ? 'migdia' : 'nit');
}

function migrarDades(d) {
  if ((d.versio || 1) >= 2) return false;
  const clauNova = function (k) {
    const p = String(k).split('|');
    if ((p[0] === 'med' || p[0] === 'act') && /^\d\d:\d\d$/.test(p[3] || '')) p[3] = momentDeHora(p[3]);
    return p.join('|');
  };
  const diaSet = function (iso) { return crearData(iso, '12:00').getDay(); };

  d.medicaments = (d.medicaments || []).map(function (m) {
    const moments = [];
    (m.hores || []).forEach(function (h) { const x = momentDeHora(h); if (moments.indexOf(x) === -1) moments.push(x); });
    return { id: m.id, nom: m.nom, dosi: m.dosi, moments: moments.length ? moments : ['mati'],
      freq: m.freq === 'dies' ? 'dies' : 'diari', dies: m.freq === 'dies' ? (m.dies || []) : [],
      diaSetmana: diaSet(m.inici || avuiISO()), diaMes: Number((m.inici || avuiISO()).slice(8, 10)),
      creat: (m.inici || avuiISO()) + 'T00:00' };
  });
  d.activitats = (d.activitats || []).map(function (a) {
    const base = { id: a.id, nom: a.nom, durada: a.durada || 30, moments: [momentDeHora(a.hora)], dies: [],
      diaSetmana: diaSet(a.data || avuiISO()), diaMes: Number((a.data || avuiISO()).slice(8, 10)), creat: (a.data || avuiISO()) + 'T00:00' };
    if (a.rep === 'diari') base.freq = 'diari';
    else if (a.rep === 'setmanal') base.freq = 'setmanal';
    else if (a.rep === 'dies') { base.freq = 'dies'; base.dies = a.dies || []; }
    else { base.freq = 'unic'; base.data = a.data; } // una sola vegada (només per a dades antigues)
    return base;
  });
  d.cites = (d.cites || []).map(function (c) {
    return { id: c.id, motiu: c.motiu, data: c.data, hora: c.hora, obs: c.obs || '' };
  });
  d.agenda = (d.agenda || []).map(function (g) {
    return { id: g.id, nom: g.nom, data: g.data, hora: g.hora, notes: g.notes || '', rep: g.rep || 'un', dies: g.dies || [] };
  });
  ['preses', 'descartats'].forEach(function (c) {
    const nou = {};
    Object.keys(d[c] || {}).forEach(function (k) { nou[clauNova(k)] = true; });
    d[c] = nou;
  });
  d.versio = 2;
  return true;
}

function llegirDades() {
  try {
    const text = localStorage.getItem(CLAU_DADES);
    if (!text) return copiaEnMemoria || dadesBuides();
    const guardades = JSON.parse(text);
    const canviat = migrarDades(guardades);
    const base = dadesBuides();
    const dades = Object.assign(base, guardades, { ajustos: Object.assign(base.ajustos, guardades.ajustos || {}) });
    if (canviat) guardarDades(dades);
    return dades;
  } catch (error) {
    emmagatzematgeDisponible = false;
    return copiaEnMemoria || dadesBuides();
  }
}

function guardarDades(dades) {
  copiaEnMemoria = dades;
  try {
    localStorage.setItem(CLAU_DADES, JSON.stringify(dades));
    emmagatzematgeDisponible = true;
    return true;
  } catch (error) {
    emmagatzematgeDisponible = false;
    return false;
  }
}

function nouId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- Avís de prova (per als investigadors) ----------
function llegirDemo() {
  try { return JSON.parse(localStorage.getItem(CLAU_DEMO) || 'null'); } catch (e) { return null; }
}
function programarDemo(clau, quan) {
  try { localStorage.setItem(CLAU_DEMO, JSON.stringify({ clau: clau, quan: quan })); return true; } catch (e) { return false; }
}
function esborrarDemo() {
  try { localStorage.removeItem(CLAU_DEMO); } catch (e) { /* res */ }
}

// ---------- Dates ----------
// Les dates es guarden com a text "AAAA-MM-DD" i les hores com "HH:MM", sempre en hora local.
function dosXifres(n) { return String(n).padStart(2, '0'); }
function dataISO(d) { return d.getFullYear() + '-' + dosXifres(d.getMonth() + 1) + '-' + dosXifres(d.getDate()); }
function avuiISO() { return dataISO(new Date()); }
function crearData(iso, hora) {
  const [a, m, d] = iso.split('-').map(Number);
  const [h, mi] = (hora || '00:00').split(':').map(Number);
  return new Date(a, m - 1, d, h, mi, 0, 0);
}
function sumarDies(iso, n) {
  const d = crearData(iso, '12:00');
  d.setDate(d.getDate() + n);
  return dataISO(d);
}
function diesEntre(isoA, isoB) {
  return Math.round((crearData(isoB, '12:00') - crearData(isoA, '12:00')) / 86400000);
}
function esDataValida(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false;
  const d = crearData(iso, '12:00');
  return !isNaN(d) && dataISO(d) === iso;
}
function esHoraValida(h) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(h || ''); }

// ---------- Estats inicials per a les proves ----------
// «Inicial de proves»: exemples ficticis, amb dates calculades a partir del dia d'avui.
function dadesInicialsDeProves() {
  const avui = avuiISO();
  const d = dadesBuides();
  const demaIso = sumarDies(avui, 1);
  const dow = function (iso) { return crearData(iso, '12:00').getDay(); };
  d.medicaments.push(
    { id: 'mex1', nom: 'Vitamina D', dosi: '1 càpsula', moments: ['mati'], freq: 'diari', dies: [],
      diaSetmana: dow(avui), diaMes: Number(avui.slice(8, 10)), creat: avui + 'T00:00' },
    { id: 'mex2', nom: 'Calci', dosi: '1 pastilla', moments: ['migdia', 'nit'], freq: 'dies', dies: [1, 3, 5],
      diaSetmana: dow(avui), diaMes: Number(avui.slice(8, 10)), creat: avui + 'T00:00' }
  );
  d.cites.push(
    { id: 'cex1', motiu: 'Revisió amb el metge de capçalera', data: demaIso, hora: '10:30',
      obs: 'La targeta sanitària' },
    { id: 'cex2', motiu: 'Analítica de sang', data: sumarDies(avui, 14), hora: '08:15',
      obs: 'Estar en dejú' }
  );
  d.activitats.push(
    { id: 'aex1', nom: 'Caminar pel parc', durada: 30, moments: ['migdia'], freq: 'setmanal', dies: [],
      diaSetmana: dow(demaIso), diaMes: Number(demaIso.slice(8, 10)), creat: avui + 'T00:00' }
  );
  d.agenda.push(
    { id: 'gex1', nom: 'Dinar amb la família', data: demaIso, hora: '14:00', notes: '', rep: 'un', dies: [] }
  );
  return d;
}
