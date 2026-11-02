// dades.js — L'únic fitxer que llegeix i guarda les dades.
// Les dades es guarden al navegador del dispositiu (localStorage), mai en un servidor.
// Cada dispositiu i cada navegador té les seves pròpies dades.

const CLAU_DADES = 'recordam.v1';   // on es guarden els registres i els ajustos
const CLAU_DEMO = 'recordam.demo';  // avís de prova programat pels investigadors

let emmagatzematgeDisponible = true;
let copiaEnMemoria = null; // només s'utilitza si el navegador no deixa guardar

function dadesBuides() {
  return {
    versio: 1,
    medicaments: [],
    cites: [],
    activitats: [],
    agenda: [],
    preses: {}, // preses fetes: { "idMedicament|AAAA-MM-DD|HH:MM": true }
    ajustos: { idioma: 'ca', mida: 'normal' },
  };
}

function llegirDades() {
  try {
    const text = localStorage.getItem(CLAU_DADES);
    if (!text) return copiaEnMemoria || dadesBuides();
    const guardades = JSON.parse(text);
    const base = dadesBuides();
    return Object.assign(base, guardades, { ajustos: Object.assign(base.ajustos, guardades.ajustos || {}) });
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
  d.medicaments.push(
    { id: 'mex1', nom: 'Vitamina D', dosi: '1 càpsula', hores: ['09:00'], freq: 'diari', dies: [],
      inici: avui, fi: '', avis: true },
    { id: 'mex2', nom: 'Calci', dosi: '1 pastilla', hores: ['13:00', '20:00'], freq: 'dies', dies: [1, 3, 5],
      inici: avui, fi: '', avis: true }
  );
  d.cites.push(
    { id: 'cex1', motiu: 'Revisió amb el metge de capçalera', data: sumarDies(avui, 2), hora: '10:30',
      lloc: 'CAP del barri', obs: 'Portar la targeta sanitària', avis: true, antelacio: 1440 }
  );
  d.activitats.push(
    { id: 'aex1', nom: 'Caminar pel parc', data: sumarDies(avui, 1), hora: '18:00', durada: 30,
      rep: 'setmanal', avis: true, antelacio: 30 }
  );
  d.agenda.push(
    { id: 'gex1', nom: 'Dinar amb la família', data: sumarDies(avui, 3), hora: '14:00', notes: '',
      rep: 'un', avis: true, antelacio: 60 }
  );
  return d;
}
