// app.js — Pantalles, navegació, formularis i avisos de Recorda'm.
//
// Com funciona la navegació: l'adreça acaba en #... i cada valor mostra una pantalla.
//   #inici                      Inici
//   #recordatoris               Properes tasques d'avui i demà (#recordatoris-7: 7 dies)
//   #medicacio                  Secció (també: cites, activitat, agenda)
//   #medicacio-llista           Tota la llista («Els meus medicaments»)
//   #medicacio-nou              Formulari per afegir
//   #medicacio-editar-ID        Formulari per canviar
// Només s'utilitzen lletres, xifres i guions: així funciona a qualsevol servidor i visor.
// Així el botó «enrere» del navegador també funciona.

'use strict';

let dades = llegirDades();
let missatgeSeguent = null;     // missatge de confirmació que es mostra a la pantalla següent
let focusDespres = null;        // element que ha de rebre el focus després de redibuixar

const main = document.getElementById('contingut');

// ================= Utilitats =================

function idioma() { return dades.ajustos.idioma === 'es' ? 'es' : 'ca'; }

function t(clau, valors) {
  let text = (TEXTOS[idioma()] && TEXTOS[idioma()][clau]);
  if (text === undefined) text = TEXTOS.ca[clau];
  if (text === undefined) text = clau;
  if (valors) Object.keys(valors).forEach(function (k) { text = text.split('{' + k + '}').join(valors[k]); });
  return text;
}

// Evita que el text que escriu la persona es pugui interpretar com a codi.
function esc(valor) {
  return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

const ICONES = {
  casa: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
  enrere: '<path d="M15 5l-7 7 7 7"/>',
  ajustos: '<path d="M19.11 9.32 L21.8 10.01 L21.8 13.99 L19.11 14.68 L18.92 15.14 L20.33 17.53 L17.53 20.33 L15.14 18.92 L14.68 19.11 L13.99 21.8 L10.01 21.8 L9.32 19.11 L8.86 18.92 L6.47 20.33 L3.67 17.53 L5.08 15.14 L4.89 14.68 L2.2 13.99 L2.2 10.01 L4.89 9.32 L5.08 8.86 L3.67 6.47 L6.47 3.67 L8.86 5.08 L9.32 4.89 L10.01 2.2 L13.99 2.2 L14.68 4.89 L15.14 5.08 L17.53 3.67 L20.33 6.47 L18.92 8.86Z"/><circle cx="12" cy="12" r="3.3"/>',
  pastilla: '<g transform="rotate(-40 12 12)"><rect x="2.5" y="8" width="19" height="8" rx="4"/><path d="M12 8H6.5a4 4 0 0 0 0 8H12z" fill="currentColor"/></g>',
  cita: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4M12 12.5v6M9 15.5h6"/>',
  caminar: '<circle cx="13.5" cy="4" r="2"/><path d="M9 21l2.5-6.5 3 3V21M11.5 14.5 12.5 9l3.5 2.5 3 .5M12.5 9l-3.5 1.5L7.5 14"/>',
  llibreta: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7.5h6M9 11.5h6M9 15.5h4"/>',
  alba: '<path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M12 6v3.5M4.6 11.6l2 2M19.4 11.6l-2 2"/>',
  llista: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  lluna: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  campana: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 1.5H4.2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  campana_no: '<path d="M6 16.5V11a6 6 0 0 1 9.5-4.9M18 11v5.5l1.8 1.5H8"/><path d="M10 20.5a2 2 0 0 0 4 0M3.5 3.5l17 17"/>',
  mes: '<path d="M12 5v14M5 12h14"/>',
  llapis: '<path d="M4 20h4.5L19.5 9 15 4.5 4 15.5z"/><path d="M13 6.5l4.5 4.5"/>',
  paperera: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
  check: '<path d="M4.5 12.5l5 5 10-11"/>',
  alerta: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  rellotge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
  fletxa: '<path d="M9 5l7 7-7 7"/>',
  desfer: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 0 10h-3"/>',
  creu: '<path d="M6 6l12 12M18 6L6 18"/>',
};

function icona(nom) {
  return '<span class="icona" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + (ICONES[nom] || '') + '</svg></span>';
}

// ---------- Format de dates ----------
function nomDia(iso) { return CALENDARI[idioma()].dies[crearData(iso, '12:00').getDay()]; }

function dataLlarga(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const mes = CALENDARI[idioma()].mesos[m - 1];
  if (idioma() === 'ca') {
    const apostrof = /^[aeiouàèéíòóú]/i.test(mes);
    return d + (apostrof ? " d'" : ' de ') + mes;
  }
  return d + ' de ' + mes;
}

// «avui», «demà» o «dimecres, 4 de novembre»
function diaRelatiu(iso, ambMajuscula) {
  const cal = CALENDARI[idioma()];
  const avui = avuiISO();
  let text;
  if (iso === avui) text = cal.avui;
  else if (iso === sumarDies(avui, 1)) text = cal.dema;
  else text = nomDia(iso) + ', ' + dataLlarga(iso);
  return ambMajuscula ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function horaCurta(h) { return h ? String(Number(h.slice(0, 2))) + ':' + h.slice(3, 5) : ''; }

function quanText(dataIso, hora) { return t('a_les', { dia: diaRelatiu(dataIso), hora: horaCurta(hora) }); }

// «avui al matí», «demà a la nit»... (medicació i exercicis) o «avui a les 10:30» (cites i agenda)
function nomMoment(cat, m) { return t('moment_' + (m === 'migdia' && cat === 'act' ? 'tarda' : m)); }
function quanOcurrencia(o) {
  if (o.moment) return t('quan_' + (o.moment === 'migdia' && o.cat === 'act' ? 'tarda' : o.moment), { dia: diaRelatiu(o.data) });
  return quanText(o.data, o.hora);
}

function llistaAmbI(elements) {
  if (elements.length <= 1) return elements.join('');
  return elements.slice(0, -1).join(', ') + ' ' + CALENDARI[idioma()].i + ' ' + elements[elements.length - 1];
}

const DURADES = [15, 30, 45, 60, 90];

function textDurada(min) {
  if (min === 60) return t('h_1');
  if (min === 90) return t('h_1_30');
  if (min > 60) {
    const h = Math.floor(min / 60), m = min % 60;
    return m ? t('h_m', { h: h, m: m }) : t('h_x', { h: h });
  }
  return t('min_x', { x: min });
}

function anunciar(text) {
  const zona = document.getElementById('anunci');
  zona.textContent = '';
  setTimeout(function () { zona.textContent = text; }, 50);
}

function trobar(cat, id) {
  return dades[CATEGORIES[cat].col].find(function (r) { return r.id === id; }) || null;
}

function desar() {
  guardarDades(dades);
  document.getElementById('avis-emmagatzematge').hidden = emmagatzematgeDisponible;
}

// ================= Navegació =================

function ruta() {
  // Accepta «#medicacio-editar-ID» i també el format antic «#/medicacio/editar/ID».
  const text = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const parts = text.split(/[\/-]/).filter(Boolean);
  return { vista: parts[0] || 'inici', accio: parts[1] || '', id: parts.slice(2).join('-') };
}

function catDeRuta(nom) {
  return Object.keys(CATEGORIES).find(function (c) { return CATEGORIES[c].ruta === nom; }) || null;
}

function anar(desti, missatge) {
  missatgeSeguent = missatge || null;
  if (location.hash === '#' + desti) render();
  else location.hash = '#' + desti;
}

window.addEventListener('hashchange', function () { render(); });

let temporitzadorMissatge = null;

function render() {
  const r = ruta();
  const cat = catDeRuta(r.vista);
  let html = '';
  let titol = '';

  if (r.vista === 'recordatoris') { html = vistaRecordatoris(r.accio === '7' ? 7 : 2); titol = t('propers'); }
  else if (cat && (r.accio === 'nou' || r.accio === 'editar')) {
    const res = vistaFormulari(cat, r.accio === 'editar' ? r.id : '');
    html = res.html; titol = res.titol;
  }
  else if (cat && r.accio === 'llista') { html = vistaLlista(cat); titol = t('llista_' + cat); }
  else if (cat) { html = vistaSeccio(cat); titol = t(CATEGORIES[cat].nom); }
  else { html = vistaInici(); titol = t('inici'); }

  let missatge = '';
  if (missatgeSeguent) {
    const m = missatgeSeguent;
    // El missatge verd (s'ha desat, s'ha esborrat...) no té botó i desapareix sol als 2 segons.
    // Els errors sí que es queden fins que la persona els tanca.
    missatge = '<div class="missatge ' + (m.tipus === 'error' ? 'missatge-error' : 'missatge-ok') + '" id="missatge">' +
      icona(m.tipus === 'error' ? 'alerta' : 'check') + '<div class="text">' + esc(m.text) + '</div>' +
      (m.tipus === 'error' ? '<button type="button" class="boto boto-secundari" data-accio="tancar-missatge">' + esc(t('tancar')) + '</button>' : '') + '</div>';
    anunciar(m.text);
    missatgeSeguent = null;
    clearTimeout(temporitzadorMissatge);
    if (m.tipus !== 'error') temporitzadorMissatge = setTimeout(function () { const el = document.getElementById('missatge'); if (el) el.remove(); }, 2000);
  }

  main.innerHTML = missatge + html;
  firmaMostrada = firmaPantalla();
  document.title = titol + " · Recorda'm";
  actualitzarCapcalera(r.vista === 'inici' || (!cat && r.vista !== 'recordatoris'));
  prepararFormulari();

  if (focusDespres) {
    const el = main.querySelector(focusDespres);
    focusDespres = null;
    if (el) { el.focus(); return; }
  }
  const h1 = main.querySelector('h1');
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
}

// Mode clar o fosc (Ajustos). El color de la barra del navegador també s'adapta.
function aplicarTema() {
  const fosc = dades.ajustos.tema === 'fosc';
  document.documentElement.setAttribute('data-tema', fosc ? 'fosc' : 'clar');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', fosc ? '#12151A' : '#1B4F8F');
}

function actualitzarCapcalera(esInici) {
  document.documentElement.lang = idioma();
  document.documentElement.setAttribute('data-mida', dades.ajustos.mida);
  aplicarTema();
  document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
  document.querySelectorAll('[data-icona]').forEach(function (el) {
    if (!el.innerHTML) el.outerHTML = icona(el.getAttribute('data-icona'));
  });
  const botoInici = document.getElementById('btn-inici');
  botoInici.hidden = esInici;
  document.getElementById('marca').hidden = !esInici;
}

// ================= Salutació i hora =================

// Bon dia: de 6:00 a 13:59. Bona tarda: de 14:00 a 20:59. Bona nit: de 21:00 a 5:59.
function claveSalutacio(ara) {
  const h = ara.getHours();
  if (h >= 6 && h < 14) return 'salutacio_dia';
  if (h >= 14 && h < 21) return 'salutacio_tarda';
  return 'salutacio_nit';
}
// «Avui és dilluns, 9 de novembre.» Les paraules d'abans i d'après la data es poden amagar visualment
// al mòbil (perquè la data i l'hora càpiguen a la mateixa línia); els lectors de pantalla ho llegeixen sencer.
function textDataAvui() {
  const marca = '\u0001';
  const parts = t('avui_es', { data: marca }).split(marca);
  const data = nomDia(avuiISO()) + ', ' + dataLlarga(avuiISO());
  return '<span class="data-pref">' + esc(parts[0] || '') + '</span><span class="data-valor">' + esc(data) + '</span><span class="data-pref">' + esc(parts[1] || '') + '</span>';
}
function horaAra(ara) { return horaCurta(dosXifres(ara.getHours()) + ':' + dosXifres(ara.getMinutes())); }

// «Firma» del que es veu a la pantalla: canvia quan una cosa es fa, s'esborra o li passa l'hora.
// Serveix per saber si cal redibuixar la pantalla sense que la persona hagi fet res.
let firmaMostrada = '';

// Les ocurrències que es veuen ara a la pantalla (properes tasques, o els moments d'avui de medicació/exercicis).
function ocurrenciesVisibles(ara) {
  const r = ruta();
  const cat = catDeRuta(r.vista);
  if (r.vista === 'recordatoris') return tasquesProperes(dades, ara, r.accio === '7' ? 7 : 2);
  if (!cat) return tasquesProperes(dades, ara, 2);
  if (!r.accio && CATEGORIES[cat].moments) return ocurrenciesDelDia(dades, cat, avuiISO());
  return [];
}

function firmaPantalla() {
  const ara = new Date();
  const r = ruta();
  const cat = catDeRuta(r.vista);
  let propera = '';
  if (cat && !CATEGORIES[cat].moments && r.accio !== 'nou' && r.accio !== 'editar') {
    const p = properaDeCategoria(dades, cat, ara);
    propera = p ? p.clau + (dades.preses[p.clau] ? ':F' : '') : '-';
  }
  return avuiISO() + '#' + propera + '#' + ocurrenciesVisibles(ara).map(function (o) {
    return o.clau + (dades.preses[o.clau] ? ':F' : (o.venc <= ara ? ':V' : ':-'));
  }).join(',');
}

// ================= Pantalla d'inici =================

function vistaInici() {
  const cats = Object.keys(CATEGORIES).map(function (c) {
    return '<li><a class="boto-cat cat-' + c + '" href="#' + CATEGORIES[c].ruta + '">' +
      '<span class="cercle">' + icona(CATEGORIES[c].icona) + '</span>' +
      '<span><span class="nom">' + esc(t(CATEGORIES[c].nom)) + '</span><span class="desc">' + esc(t('desc_' + c)) + '</span></span>' +
      '<span class="fletxa">' + icona('fletxa') + '</span></a></li>';
  }).join('');

  const ara = new Date();
  const propers = tasquesProperes(dades, ara, 2);
  const llista = propers.length
    ? '<ul class="llista llista-tasques">' + propers.map(function (o) { return elementRecordatori(o, false); }).join('') + '</ul>'
    : '<p class="buit">' + esc(t('cap_recordatori')) + '</p>';

  return '<div class="salutacio"><h1 id="salutacio-text">' + esc(t(claveSalutacio(ara))) + '</h1>' +
    '<div class="salutacio-fila">' +
      '<p class="data-avui">' + textDataAvui() + '</p>' +
      '<p class="hora-actual">' + icona('rellotge') + '<span>' + esc(t('hora_actual')) + '</span> <strong id="hora-actual-valor">' + esc(horaAra(ara)) + '</strong></p>' +
    '</div></div>' +
    '<h2 class="visualment-amagat">' + esc(t('que_vols_fer')) + '</h2>' +
    '<ul class="graella-cat">' + cats + '</ul>' +
    '<section aria-labelledby="titol-propers"><h2 id="titol-propers" class="titol-seccio">' + icona('campana') + esc(t('propers')) + '</h2>' +
    llista +
    '</section>';
}

// ================= Properes tasques =================

function etiquetaCat(cat) {
  return '<span class="etiqueta-cat">' + icona(CATEGORIES[cat].icona) + esc(t(CATEGORIES[cat].nom)) + '</span>';
}

function detallOcurrencia(o) {
  const r = o.registre;
  if (o.cat === 'med') return t('dosi_x', { x: r.dosi });
  if (o.cat === 'cites') return r.obs || '';
  if (o.cat === 'act') return t('durada_x', { x: textDurada(r.durada) });
  return r.notes || '';
}

// Botó «x Treure». Només treu aquesta vegada de la llista: no esborra el medicament, la cita ni la tasca.
function botoTreure(o) {
  return '<button type="button" class="boto boto-treure boto-compacte" data-accio="treure-avis" data-clau="' + esc(o.clau) + '" aria-label="' +
    esc(t('treure_aria', { nom: o.titol, quan: quanOcurrencia(o) })) + '">' +
    icona('creu') + '<span>' + esc(t('treure')) + '</span></button>';
}

// «Avui», «Demà» o «Dimecres 11» (curt, perquè la targeta no creixi).
function diaCurt(iso) {
  if (iso === avuiISO()) return t('today_curt');
  if (iso === sumarDies(avuiISO(), 1)) return t('tomorrow_curt');
  return nomDia(iso) + ' ' + Number(iso.slice(8, 10));
}

// Una tasca de la llista «Properes tasques» (cites i agenda): targeta compacta amb l'hora a l'esquerra.
// L'avís vermell només surt quan ja ha passat l'hora i la tasca no està feta.
// «complet» afegeix el detall i el botó de canviar (llista de 7 dies).
function elementRecordatori(o, complet, propera) {
  const ara = new Date();
  const feta = !!dades.preses[o.clau];
  const vencuda = !feta && o.venc <= ara;
  const detall = detallOcurrencia(o);
  const clauAttr = esc(o.clau);
  const classes = 'targeta tasca cat-' + o.cat + (feta ? ' tasca-feta' : '') + (vencuda ? ' tasca-vencuda' : '') + (complet ? ' tasca-complet' : '');

  let meta = propera ? '' : etiquetaCat(o.cat);
  // Les cites mostren sempre el dia complet («Demà, dimarts 17 de novembre») i què cal portar, també a la pantalla d'inici.
  if (propera || (o.cat === 'cites' && !complet)) meta += '<span class="tasca-dia">' + esc(diaRelatiu(o.data, true) + (o.data === avuiISO() || o.data === sumarDies(avuiISO(), 1) ? ', ' + nomDia(o.data) + ' ' + dataLlarga(o.data) : '')) + '</span>';
  else if (!complet) meta += '<span class="tasca-dia">' + esc(diaCurt(o.data)) + '</span>';
  if (feta) meta += '<span class="estat estat-feta">' + icona('check') + esc(t('fet_estat')) + '</span>';
  if (vencuda) meta += '<span class="alerta-vencuda">' + icona('alerta') + '<span>' + esc(t('vencuda')) + '</span></span>';

  let html = '<li class="' + classes + '">' +
    '<div class="tasca-hora">' + esc(horaCurta(o.hora)) + '</div>' +
    '<div class="tasca-cos">' +
      '<h3 class="tasca-titol">' + esc(o.titol) + '</h3>' +
      '<div class="tasca-meta">' + meta + '</div>';
  if ((propera || complet || o.cat === 'cites') && detall) html += '<p class="tasca-detall">' + esc(detall) + '</p>';

  html += '</div><div class="tasca-botons">' +
    (feta
      ? '<button type="button" class="boto boto-secundari boto-compacte" data-accio="desfer-fet" data-clau="' + clauAttr + '">' + icona('desfer') + esc(t('desfer')) + '</button>'
      : '<button type="button" class="boto boto-principal boto-compacte" data-accio="fet" data-clau="' + clauAttr + '">' + icona('check') + esc(t('fet_boto')) + '</button>') +
    (o.cat === 'cites' && !propera ? '' : botoTreure(o)); // les cites de la pantalla d'inici només tenen «Fet»
  if (complet) {
    html += '<a class="boto boto-secundari boto-compacte" href="#' + CATEGORIES[o.cat].ruta + '-editar-' + encodeURIComponent(o.id) + '">' + icona('llapis') + esc(t('canviar')) + '</a>';
  }
  html += '</div></li>';
  return html;
}

function vistaRecordatoris(dies) {
  const llista = tasquesProperes(dades, new Date(), dies);
  const canvi = dies === 2
    ? '<a class="boto boto-secundari boto-ample" href="#recordatoris-7">' + esc(t('veure_7')) + icona('fletxa') + '</a>'
    : '<a class="boto boto-secundari boto-ample" href="#recordatoris">' + esc(t('veure_3')) + '</a>';
  let html = '<h1 class="titol-seccio">' + icona('campana') + esc(t('propers')) + '</h1>';
  if (!llista.length) return html + '<p class="buit">' + esc(t('recordatoris_buit', { n: dies })) + '</p><div class="fila-botons">' + canvi + '</div>';
  let diaActual = '';
  llista.forEach(function (o) {
    if (o.data !== diaActual) {
      if (diaActual) html += '</ul></section>';
      diaActual = o.data;
      html += '<section class="dia-grup"><h2>' + esc(diaRelatiu(o.data, true) + (o.data === avuiISO() || o.data === sumarDies(avuiISO(), 1) ? ', ' + nomDia(o.data) + ' ' + dataLlarga(o.data) : '')) + '</h2><ul class="llista llista-tasques">';
    }
    html += elementRecordatori(o, true);
  });
  return html + '</ul></section><div class="fila-botons">' + canvi + '</div>';
}

// ================= Seccions =================

function capSeccio(cat) {
  return '<h1 class="titol-seccio cat-' + cat + '"><span class="cercle">' + icona(CATEGORIES[cat].icona) + '</span>' + esc(t(CATEGORIES[cat].nom)) + '</h1>';
}

function botoAfegir(cat, ample) {
  return '<a class="boto boto-principal' + (ample ? ' boto-ample' : '') + '" href="#' + CATEGORIES[cat].ruta + '-nou">' + icona('mes') + esc(t('afegir_' + cat)) + '</a>';
}

// Els dos botons de cada secció: afegir i veure la llista sencera.
function botonsSeccio(cat) {
  return '<div class="fila-botons fila-dos">' + botoAfegir(cat) +
    '<a class="boto boto-secundari" href="#' + CATEGORIES[cat].ruta + '-llista">' + icona('llista') + esc(t('llista_' + cat)) + '</a></div>';
}

// Quan encara no hi ha res apuntat: missatge al mig i botó d'afegir.
function estatBuit(cat) {
  return '<div class="estat-buit"><p>' + esc(t('buit_' + cat)) + '</p>' + botoAfegir(cat, true) + '</div>';
}

function botoTornar(cat) {
  return '<a class="boto boto-secundari boto-ample" href="#' + CATEGORIES[cat].ruta + '">' + icona('enrere') + esc(t('tornar_a', { x: t(CATEGORIES[cat].nom) })) + '</a>';
}

function linia(text, negreta) { return text ? '<p class="linia">' + (negreta ? '<strong>' + esc(text) + '</strong>' : esc(text)) + '</p>' : ''; }

function nomsDies(dies) {
  return llistaAmbI(dies.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (d) { return CALENDARI[idioma()].dies[d]; }));
}

// «Cada dia», «Cada dimecres», «El dia 15 de cada mes», «Cada dilluns, dimecres i divendres»
function textFrequencia(r) {
  const f = r.freq || r.rep || 'un';
  const cal = CALENDARI[idioma()];
  if (f === 'diari') return t('text_cada_dia');
  if (f === 'setmanal2' || f === 'setmanal3') return t('text_setmanes', { n: f === 'setmanal2' ? 2 : 3, x: cal.dies[r.diaSetmana] });
  if (f === 'setmanal') return t('text_setmanal', { x: cal.dies[r.diaSetmana != null ? r.diaSetmana : crearData(r.data, '12:00').getDay()] });
  if (f === 'mensual') return t('text_mensual', { x: r.diaMes != null ? r.diaMes : Number(r.data.slice(8, 10)) });
  if (f === 'dies') return t('text_dies', { x: nomsDies(r.dies || []) });
  if (f === 'unic') return t('text_unic', { x: dataLlarga(r.data) });
  return '';
}

function majuscula(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

// «Matí i nit», «Matí, migdia i nit»
function textMoments(cat, r) {
  return majuscula(llistaAmbI(ORDRE_MOMENTS.filter(function (m) { return (r.moments || []).indexOf(m) > -1; }).map(function (m) { return nomMoment(cat, m).toLowerCase(); })));
}

// ---------- Medicació i exercicis: el que toca avui, per moments del dia ----------

function filaDosi(o, ara) {
  const feta = !!dades.preses[o.clau];
  const vencuda = !feta && o.venc <= ara;
  const clau = esc(o.clau);
  const esMed = o.cat === 'med';
  const detall = esMed ? t('dosi_x', { x: o.registre.dosi }) : t('durada_x', { x: textDurada(o.registre.durada) });
  let botons;
  if (esMed) {
    // Medicació: un sol botó. «Fet» marca la presa; un cop feta, el mateix botó diu «Pendent» i la torna a deixar pendent.
    // Té sempre la mateixa mida, estigui feta o no.
    botons = '<button type="button" class="boto boto-compacte boto-estat ' + (feta ? 'boto-secundari' : 'boto-fet') + '" data-accio="presa" data-clau="' + clau + '" aria-label="' +
      esc(t(feta ? 'pendent_boto' : 'fet_boto') + ': ' + o.titol) + '">' +
      icona(feta ? 'desfer' : 'check') + esc(t(feta ? 'pendent_boto' : 'fet_boto')) + '</button>';
  } else {
    botons = feta
      ? '<button type="button" class="boto boto-secundari boto-compacte" data-accio="presa" data-clau="' + clau + '">' + icona('desfer') + esc(t('desfer')) + '</button>'
      : '<button type="button" class="boto boto-fet boto-compacte" data-accio="presa" data-clau="' + clau + '">' + icona('check') + esc(t('fet_boto')) + '</button>' + botoTreure(o);
  }
  return '<li class="dosi' + (esMed ? ' dosi-med' : '') + (feta ? ' dosi-feta' : '') + (vencuda ? ' dosi-vencuda' : '') + '">' +
    '<div class="dosi-text"><h3>' + esc(o.titol) + '</h3><p class="linia">' + esc(detall) + '</p>' +
      (feta && !esMed ? '<span class="estat estat-feta">' + icona('check') + esc(t('fet_estat')) + '</span>' : '') +
      (vencuda ? '<span class="alerta-vencuda">' + icona('alerta') + '<span>' + esc(t('vencuda')) + '</span></span>' : '') +
    '</div><div class="dosi-botons">' + botons + '</div></li>';
}

function blocMoment(cat, m, ocs, ara) {
  const id = 'moment-' + cat + '-' + m;
  return '<section class="moment cat-' + cat + '" aria-labelledby="' + id + '">' +
    '<h2 id="' + id + '" class="moment-titol">' + icona(MOMENTS[m].icona) + esc(nomMoment(cat, m)) + '</h2>' +
    (ocs.length
      ? '<ul class="llista llista-dosis">' + ocs.map(function (o) { return filaDosi(o, ara); }).join('') + '</ul>'
      : '<p class="moment-buit">' + esc(t(cat === 'med' ? 'res_med' : 'res_act')) + '</p>') +
    '</section>';
}

// ---------- Cites i agenda: la propera ----------

function fitxaPropera(o) {
  const r = o.registre;
  const relatiu = o.data === avuiISO() || o.data === sumarDies(avuiISO(), 1);
  let html = '<div class="propera-quan"><span class="propera-dia">' + esc(diaRelatiu(o.data, true)) + '</span>' +
    '<span class="propera-hora">' + icona('rellotge') + esc(horaCurta(o.hora)) + '</span></div>';
  if (relatiu) html += '<p class="propera-data">' + esc(majuscula(nomDia(o.data) + ', ' + dataLlarga(o.data))) + '</p>';
  html += '<h3 class="propera-titol">' + esc(o.titol) + '</h3>';
  html += linia(r.notes) + linia(textFrequencia(r));
  return html;
}

function vistaSeccio(cat) {
  const ara = new Date();
  let html = capSeccio(cat);
  if (!dades[CATEGORIES[cat].col].length) return html + estatBuit(cat);

  if (CATEGORIES[cat].moments) {
    const ocs = ocurrenciesDelDia(dades, cat, avuiISO());
    html += '<div class="moments">' + ORDRE_MOMENTS.map(function (m) {
      return blocMoment(cat, m, ocs.filter(function (o) { return o.moment === m; }), ara);
    }).join('') + '</div>';
    return html + botonsSeccio(cat);
  }

  const p = properaDeCategoria(dades, cat, ara);
  let targetaPropera = '';
  if (p && cat === 'cites') targetaPropera = '<ul class="llista llista-tasques">' + elementRecordatori(p, false, true) + '</ul>'; // compacta, amb Fet i Treure
  else if (p) targetaPropera = '<div class="propera-targeta">' + fitxaPropera(p) + '</div>';
  html += '<section class="propera cat-' + cat + '"><h2 class="propera-cap">' + esc(t(cat === 'cites' ? 'propera_cita' : 'propera_agenda')) + '</h2>' +
    (targetaPropera || '<p class="moment-buit">' + esc(t(cat === 'cites' ? 'cap_cita' : 'cap_agenda')) + '</p>') +
    '</section>';
  return html + botonsSeccio(cat);
}

// ---------- Pantalla «Els meus medicaments», «Les meves cites»... ----------

function botonsTargeta(cat, r) {
  return '<div class="fila-botons">' +
    '<a class="boto boto-secundari" href="#' + CATEGORIES[cat].ruta + '-editar-' + encodeURIComponent(r.id) + '">' + icona('llapis') + esc(t('canviar')) + '<span class="visualment-amagat">: ' + esc(titolDe(cat, r)) + '</span></a>' +
    '<button type="button" class="boto boto-perill-suau" data-accio="esborrar" data-cat="' + cat + '" data-id="' + esc(r.id) + '">' + icona('paperera') + esc(t('esborrar')) + '<span class="visualment-amagat">: ' + esc(titolDe(cat, r)) + '</span></button>' +
    '</div>';
}

function targeta(cat, r, extra) {
  return '<li class="targeta cat-' + cat + (extra && extra.passat ? ' passat' : '') + '"><h3>' + esc(titolDe(cat, r)) + '</h3>' + (extra && extra.linies || '') + botonsTargeta(cat, r) + '</li>';
}

function ordenarPerPropera(cat, registres) {
  const ara = new Date();
  return registres.map(function (r) { return { r: r, propera: properaVegada(dades, cat, r.id, ara) }; })
    .sort(function (a, b) {
      if (a.propera && b.propera) return a.propera.quan - b.propera.quan;
      if (a.propera) return -1;
      if (b.propera) return 1;
      return crearData(b.r.data, b.r.hora) - crearData(a.r.data, a.r.hora);
    });
}

function vistaLlista(cat) {
  let html = '<h1 class="titol-seccio cat-' + cat + '"><span class="cercle">' + icona(CATEGORIES[cat].icona) + '</span>' + esc(t('llista_' + cat)) + '</h1>';
  const registres = dades[CATEGORIES[cat].col];
  if (!registres.length) return html + estatBuit(cat) + '<div class="fila-botons">' + botoTornar(cat) + '</div>';
  const peu = '<div class="fila-botons fila-dos">' + botoAfegir(cat) + botoTornar(cat) + '</div>';

  if (cat === 'med' || cat === 'act') {
    const ordenats = registres.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    return html + '<ul class="llista">' + ordenats.map(function (r) {
      return targeta(cat, r, { linies: linia(cat === 'med' ? t('dosi_x', { x: r.dosi }) : t('durada_x', { x: textDurada(r.durada) })) + linia(textMoments(cat, r)) + linia(textFrequencia(r)) });
    }).join('') + '</ul>' + peu;
  }

  if (cat === 'cites') {
    const ara = new Date();
    const totes = registres.slice().sort(function (a, b) { return crearData(a.data, a.hora) - crearData(b.data, b.hora); });
    const futures = totes.filter(function (c) { return crearData(c.data, c.hora) >= ara; });
    const passades = totes.filter(function (c) { return crearData(c.data, c.hora) < ara; }).reverse();
    const fitxa = function (c, passat) {
      return targeta('cites', c, { passat: passat, linies: linia(t('a_les', { dia: diaRelatiu(c.data, true), hora: horaCurta(c.hora) }), true) + linia(c.obs) });
    };
    if (futures.length) html += '<h2>' + esc(t('properes_cites')) + '</h2><ul class="llista">' + futures.map(function (c) { return fitxa(c, false); }).join('') + '</ul>';
    if (passades.length) html += '<h2>' + esc(t('cites_passades')) + '</h2><ul class="llista">' + passades.map(function (c) { return fitxa(c, true); }).join('') + '</ul>';
    return html + peu;
  }

  // Agenda
  const ordenades = ordenarPerPropera('agenda', registres);
  const futures = ordenades.filter(function (x) { return x.propera; });
  const passades = ordenades.filter(function (x) { return !x.propera; });
  const fitxa = function (x) {
    const r = x.r, p = x.propera;
    return targeta('agenda', r, {
      passat: !p,
      linies: linia(t('a_les', { dia: diaRelatiu(p ? p.data : r.data, true), hora: horaCurta(p ? p.hora : r.hora) }), true) + linia(r.notes) + linia(textFrequencia(r)),
    });
  };
  if (futures.length) html += '<h2>' + esc(t('properes_agenda')) + '</h2><ul class="llista">' + futures.map(fitxa).join('') + '</ul>';
  if (passades.length) html += '<h2>' + esc(t('agenda_passades')) + '</h2><ul class="llista">' + passades.map(fitxa).join('') + '</ul>';
  return html + peu;
}

// ================= Formularis =================

function etiquetaCamp(text, oblig) {
  return esc(text) + ' <span class="marca-oblig">' + esc(oblig ? t('obligatori') : t('opcional')) + '</span>';
}

function campText(nom, etiqueta, valor, opts) {
  opts = opts || {};
  const ajuda = opts.ajuda ? '<p class="ajuda" id="ajuda-' + nom + '">' + esc(opts.ajuda) + '</p>' : '';
  const descr = [opts.ajuda ? 'ajuda-' + nom : '', 'error-' + nom].filter(Boolean).join(' ');
  const control = opts.multilinia
    ? '<textarea id="' + nom + '" name="' + nom + '" aria-describedby="' + descr + '">' + esc(valor) + '</textarea>'
    : '<input type="text"' + (opts.numeric ? ' inputmode="numeric" pattern="[0-9]*"' : '') + ' id="' + nom + '" name="' + nom + '" value="' + esc(valor) + '" autocomplete="off" aria-describedby="' + descr + '"' + (opts.oblig ? ' aria-required="true"' : '') + '>';
  return '<div class="camp"><label for="' + nom + '">' + etiquetaCamp(etiqueta, opts.oblig) + '</label>' + ajuda + control + '<div id="error-' + nom + '"></div></div>';
}

function campData(nom, etiqueta, valor, oblig, ajuda) {
  const aj = ajuda ? '<p class="ajuda" id="ajuda-' + nom + '">' + esc(ajuda) + '</p>' : '';
  return '<div class="camp"><label for="' + nom + '">' + etiquetaCamp(etiqueta, oblig) + '</label>' + aj +
    '<div class="data-rapida"><input type="date" id="' + nom + '" name="' + nom + '" value="' + esc(valor) + '" aria-describedby="' + (ajuda ? 'ajuda-' + nom + ' ' : '') + 'error-' + nom + '"' + (oblig ? ' aria-required="true"' : '') + '>' +
    '<button type="button" class="boto boto-secundari" data-accio="posar-data" data-camp="' + nom + '" data-dies="0">' + esc(t('avui')) + '<span class="visualment-amagat">: ' + esc(etiqueta) + '</span></button>' +
    '<button type="button" class="boto boto-secundari" data-accio="posar-data" data-camp="' + nom + '" data-dies="1">' + esc(t('dema')) + '<span class="visualment-amagat">: ' + esc(etiqueta) + '</span></button>' +
    '</div><div id="error-' + nom + '"></div></div>';
}

function campHora(nom, etiqueta, valor) {
  return '<div class="camp"><label for="' + nom + '">' + etiquetaCamp(etiqueta, true) + '</label>' +
    '<input type="time" id="' + nom + '" name="' + nom + '" value="' + esc(valor) + '" aria-required="true" aria-describedby="error-' + nom + '"><div id="error-' + nom + '"></div></div>';
}

function grupOpcions(nom, llegenda, opcions, valor, oblig, extraClasse) {
  return '<fieldset class="' + (extraClasse || '') + '" id="grup-' + nom + '" aria-describedby="error-' + nom + '"><legend>' + etiquetaCamp(llegenda, oblig) + '</legend><div class="opcions">' +
    opcions.map(function (o) {
      return '<label class="opcio"><input type="radio" name="' + nom + '" value="' + esc(o.valor) + '"' + (String(o.valor) === String(valor) ? ' checked' : '') + '><span>' + esc(o.text) + '</span></label>';
    }).join('') + '</div><div id="error-' + nom + '"></div></fieldset>';
}

// Caselles de dies de la setmana (de dilluns a diumenge)
const ORDRE_DIES = [1, 2, 3, 4, 5, 6, 0];
function caselaDies(nom, marcats, id, llegenda, amagat, tipus) {
  return '<fieldset id="' + id + '" class="' + (amagat ? 'amagat' : '') + '" aria-describedby="error-' + nom + '"><legend>' + etiquetaCamp(llegenda, true) + '</legend><div class="opcions">' +
    ORDRE_DIES.map(function (d) {
      return '<label class="opcio"><input type="' + tipus + '" name="' + nom + '" value="' + d + '"' + (marcats.indexOf(d) > -1 ? ' checked' : '') + '><span>' + esc(CALENDARI[idioma()].dies[d]) + '</span></label>';
    }).join('') + '</div><div id="error-' + nom + '"></div></fieldset>';
}

// Moments del dia: matí, migdia (tarda als exercicis) i nit. Es poden triar un, dos o els tres.
function campMoments(cat, marcats) {
  return '<fieldset id="grup-moments" aria-describedby="error-moments"><legend>' + etiquetaCamp(t('moments_' + cat), true) + '</legend>' +
    '<div class="opcions opcions-moments">' +
    ORDRE_MOMENTS.map(function (m) {
      return '<label class="opcio"><input type="checkbox" name="moments" value="' + m + '"' + (marcats.indexOf(m) > -1 ? ' checked' : '') + '><span>' + icona(MOMENTS[m].icona) + esc(nomMoment(cat, m)) + '</span></label>';
    }).join('') + '</div><div id="error-moments"></div></fieldset>';
}

// Cada dia | Cada setmana | Cada mes | Només alguns dies.
// Setmana i mes demanen una sola dada més (el dia), ja triada amb la data d'avui perquè només calgui confirmar-la.
function campsFrequencia(v, ambSetmanes) {
  const f = v.freq;
  const setmanal = f === 'setmanal' || f === 'setmanal2' || f === 'setmanal3';
  const opcions = [{ valor: 'diari', text: t('freq_diari') }, { valor: 'setmanal', text: t('freq_setmanal') }];
  if (ambSetmanes) opcions.push({ valor: 'setmanal2', text: t('freq_setmanal2') }, { valor: 'setmanal3', text: t('freq_setmanal3') });
  opcions.push({ valor: 'mensual', text: t('freq_mensual') }, { valor: 'dies', text: t('freq_dies') });
  let html = grupOpcions('freq', t('med_freq'), opcions, f, true);
  html += '<fieldset id="grup-diasetmana" class="' + (setmanal ? '' : 'amagat') + '"><legend>' + etiquetaCamp(t('dia_setmana_q'), true) + '</legend><div class="opcions">' +
    ORDRE_DIES.map(function (d) {
      return '<label class="opcio"><input type="radio" name="diasetmana" value="' + d + '"' + (Number(v.diaSetmana) === d ? ' checked' : '') + '><span>' + esc(CALENDARI[idioma()].dies[d]) + '</span></label>';
    }).join('') + '</div></fieldset>';
  html += '<div class="camp' + (f === 'mensual' ? '' : ' amagat') + '" id="camp-diames"><label for="diames">' + etiquetaCamp(t('dia_mes_q'), true) + '</label>' +
    '<input type="text" inputmode="numeric" pattern="[0-9]*" id="diames" name="diames" value="' + esc(v.diaMes) + '" autocomplete="off" aria-describedby="error-diames"><div id="error-diames"></div></div>';
  html += caselaDies('dies', v.dies || [], 'grup-dies', t('med_dies'), f !== 'dies', 'checkbox');
  return html;
}

// Agenda: es repeteix? (el dia de la setmana o del mes surt de la data triada)
function campsRepeticio(v) {
  let html = grupOpcions('rep', t('repeticio'), [
    { valor: 'un', text: t('rep_un') }, { valor: 'diari', text: t('rep_diari') }, { valor: 'setmanal', text: t('rep_setmanal') },
    { valor: 'mensual', text: t('rep_mensual') }, { valor: 'dies', text: t('rep_dies') },
  ], v.rep, true);
  html += caselaDies('repdies', v.dies || [], 'grup-repdies', t('med_dies'), v.rep !== 'dies', 'checkbox');
  return html;
}

function valorsPerDefecte(cat) {
  const avui = avuiISO();
  const diaSetmana = crearData(avui, '12:00').getDay();
  const diaMes = Number(avui.slice(8, 10));
  if (cat === 'med') return { nom: '', dosi: '', moments: [], freq: 'diari', dies: [], diaSetmana: diaSetmana, diaMes: diaMes };
  if (cat === 'act') return { nom: '', durada: 30, moments: [], freq: 'diari', dies: [], diaSetmana: diaSetmana, diaMes: diaMes };
  if (cat === 'cites') return { motiu: '', data: '', hora: '', obs: '' };
  return { nom: '', data: '', hora: '', notes: '', rep: 'un', dies: [] };
}

function vistaFormulari(cat, id) {
  const editant = !!id;
  const r = editant ? trobar(cat, id) : null;
  if (editant && !r) {
    missatgeSeguent = { tipus: 'error', text: t('no_trobat') };
    return { html: vistaLlista(cat), titol: t(CATEGORIES[cat].nom) };
  }
  let v = r || valorsPerDefecte(cat);
  if (v.freq === 'unic') v = Object.assign({}, v, { freq: 'dies', dies: [crearData(v.data, '12:00').getDay()] }); // exercici d'una sola vegada (dades antigues)
  const titol = t((editant ? 'canviar_' : 'afegir_') + cat);
  const textDesar = t('desar');
  const tornada = '#' + CATEGORIES[cat].ruta + (editant ? '-llista' : '');

  let camps = '';
  if (cat === 'med') {
    camps += campText('nom', t('med_nom'), v.nom, { oblig: true });
    camps += campText('dosi', t('med_dosi'), v.dosi, { oblig: true });
    camps += campMoments('med', v.moments);
    camps += campsFrequencia(v, true);
  } else if (cat === 'act') {
    camps += campText('nom', t('act_nom'), v.nom, { oblig: true });
    const altra = DURADES.indexOf(Number(v.durada)) === -1;
    camps += grupOpcions('durada', t('act_durada'), DURADES.map(function (m) { return { valor: m, text: textDurada(m) }; }).concat([{ valor: 'altra', text: t('durada_altra') }]), altra ? 'altra' : v.durada, true);
    camps += '<div class="camp' + (altra ? '' : ' amagat') + '" id="camp-minuts"><label for="minuts">' + etiquetaCamp(t('durada_minuts'), true) + '</label>' +
      '<input type="text" inputmode="numeric" pattern="[0-9]*" id="minuts" name="minuts" value="' + (altra ? esc(v.durada) : '') + '" autocomplete="off" aria-describedby="error-minuts"><div id="error-minuts"></div></div>';
    camps += campMoments('act', v.moments);
    camps += campsFrequencia(v);
  } else if (cat === 'cites') {
    camps += campText('motiu', t('cita_motiu'), v.motiu, { oblig: true });
    camps += campData('data', t('data'), v.data, true);
    camps += campHora('hora', t('hora'), v.hora);
    camps += campText('obs', t('cita_obs'), v.obs, { multilinia: true });
  } else {
    camps += campText('nom', t('agenda_nom'), v.nom, { oblig: true });
    camps += campData('data', t('data'), v.data, true);
    camps += campHora('hora', t('hora'), v.hora);
    camps += campText('notes', t('agenda_notes'), v.notes, { multilinia: true });
    camps += campsRepeticio(v);
  }

  // Els botons Desar (blau, a l'esquerra) i Cancel·lar (vermell, a la dreta) queden fixos a baix de la pantalla.
  const botoCancelar = '<a class="boto boto-cancela" href="' + tornada + '">' + icona('creu') + esc(t('cancelar')) + '</a>';
  const botoDesar = '<button type="submit" class="boto ' + 'boto-principal' + '">' + icona('check') + esc(textDesar) + '</button>';
  const botonsBarra = botoDesar + botoCancelar;
  const html = '<h1 class="titol-seccio cat-' + cat + '"><span class="cercle">' + icona(CATEGORIES[cat].icona) + '</span>' + esc(titol) + '</h1>' +
    '<form id="formulari" novalidate data-cat="' + cat + '" data-id="' + esc(id) + '">' +
    '<div id="resum-errors"></div>' + camps +
    '<div class="botons-form"><div class="botons-form-dins">' + botonsBarra + '</div></div></form>';
  return { html: html, titol: titol };
}

// Mostra o amaga parts del formulari segons el que es tria.
function prepararFormulari() {
  const form = document.getElementById('formulari');
  if (!form) return;
  form.addEventListener('change', function (e) {
    if (e.target.name === 'freq') {
      document.getElementById('grup-diasetmana').classList.toggle('amagat', e.target.value.indexOf('setmanal') !== 0);
      document.getElementById('camp-diames').classList.toggle('amagat', e.target.value !== 'mensual');
      document.getElementById('grup-dies').classList.toggle('amagat', e.target.value !== 'dies');
    }
    if (e.target.name === 'rep') document.getElementById('grup-repdies').classList.toggle('amagat', e.target.value !== 'dies');
    if (e.target.name === 'durada') document.getElementById('camp-minuts').classList.toggle('amagat', e.target.value !== 'altra');
  });
}

function mostrarError(form, nom, text) {
  const zona = form.querySelector('#error-' + nom);
  if (zona) zona.innerHTML = '<p class="error-camp">' + icona('alerta') + '<span>' + esc(text) + '</span></p>';
  const control = form.querySelector('#' + nom);
  if (control && control.type !== 'radio' && control.type !== 'checkbox') control.setAttribute('aria-invalid', 'true');
}

function netejarErrors(form) {
  form.querySelectorAll('[id^="error-"]').forEach(function (z) { z.innerHTML = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
  form.querySelector('#resum-errors').innerHTML = '';
}

function ahoText() {
  const a = new Date();
  return dataISO(a) + 'T' + dosXifres(a.getHours()) + ':' + dosXifres(a.getMinutes());
}

function enviarFormulari(form) {
  const cat = form.getAttribute('data-cat');
  const id = form.getAttribute('data-id');
  const f = new FormData(form);
  const val = function (n) { return String(f.get(n) || '').trim(); };
  const errors = [];
  const err = function (nom, clau) { errors.push(nom); mostrarError(form, nom, t(clau)); };
  netejarErrors(form);

  let reg;
  if (cat === 'med' || cat === 'act') {
    const moments = ORDRE_MOMENTS.filter(function (m) { return f.getAll('moments').indexOf(m) > -1; });
    const freq = val('freq') || 'diari';
    reg = { nom: val('nom'), moments: moments, freq: freq, dies: [], diaSetmana: Number(f.get('diasetmana')), diaMes: Number(val('diames')) };
    if (cat === 'med') reg.dosi = val('dosi');
    if (!reg.nom) err('nom', cat === 'med' ? 'err_med_nom' : 'err_act_nom');
    if (cat === 'med' && !reg.dosi) err('dosi', 'err_med_dosi');
    if (cat === 'act') {
      if (val('durada') === 'altra') {
        const m = val('minuts');
        if (!/^\d+$/.test(m) || Number(m) < 1 || Number(m) > 720) err('minuts', 'err_minuts');
        else reg.durada = Number(m);
      } else reg.durada = Number(val('durada')) || 30;
    }
    if (!moments.length) err('moments', 'err_moments');
    if (freq === 'dies') {
      reg.dies = f.getAll('dies').map(Number);
      if (!reg.dies.length) err('dies', 'err_dies');
    }
    if (freq === 'mensual' && (!/^\d+$/.test(val('diames')) || reg.diaMes < 1 || reg.diaMes > 31)) err('diames', 'err_dia_mes');
    if (freq !== 'mensual' && !(reg.diaMes >= 1 && reg.diaMes <= 31)) reg.diaMes = Number(avuiISO().slice(8, 10));
    if (!(reg.diaSetmana >= 0 && reg.diaSetmana <= 6)) reg.diaSetmana = crearData(avuiISO(), '12:00').getDay();
    // Cada 2 o 3 setmanes: la primera vegada és el primer dia triat a partir d'avui (si no es canvia, es manté).
    reg.ancora = '';
    if (freq === 'setmanal2' || freq === 'setmanal3') {
      const abans = id ? trobar(cat, id) : null;
      if (abans && abans.freq === freq && abans.diaSetmana === reg.diaSetmana && abans.ancora) reg.ancora = abans.ancora;
      else { let d = avuiISO(); while (crearData(d, '12:00').getDay() !== reg.diaSetmana) d = sumarDies(d, 1); reg.ancora = d; }
    }
  } else if (cat === 'cites') {
    reg = { motiu: val('motiu'), data: val('data'), hora: val('hora'), obs: val('obs') };
    if (!reg.motiu) err('motiu', 'err_cita_motiu');
    if (!esDataValida(reg.data)) err('data', 'err_data');
    if (!esHoraValida(reg.hora)) err('hora', 'err_hora');
  } else {
    reg = { nom: val('nom'), data: val('data'), hora: val('hora'), notes: val('notes'), rep: val('rep') || 'un', dies: [] };
    if (!reg.nom) err('nom', 'err_agenda_nom');
    if (!esDataValida(reg.data)) err('data', 'err_data');
    if (!esHoraValida(reg.hora)) err('hora', 'err_hora');
    if (reg.rep === 'dies') {
      reg.dies = f.getAll('repdies').map(Number);
      if (!reg.dies.length) err('repdies', 'err_dies');
    }
  }

  if (errors.length) {
    form.querySelector('#resum-errors').innerHTML = '<div class="missatge missatge-error" role="alert">' + icona('alerta') + '<div class="text">' + esc(t('revisa')) + '</div></div>';
    const primer = errors[0];
    const control = form.querySelector('#' + primer) || form.querySelector('#grup-' + primer + ' input');
    if (control) control.focus();
    window.scrollTo(0, 0);
    return;
  }

  const col = dades[CATEGORIES[cat].col];
  const ambMoments = cat === 'med' || cat === 'act';
  if (id) {
    const existent = trobar(cat, id);
    if (!existent) { anar(CATEGORIES[cat].ruta, { tipus: 'error', text: t('no_trobat') }); return; }
    if (ambMoments) {
      // Si es canvia quan es fa, es compta des d'ara (no apareixen moments d'avui que ja han passat).
      const clauPla = function (x) { return JSON.stringify([x.moments, x.freq, x.dies, x.freq === 'setmanal' ? x.diaSetmana : 0, x.freq === 'mensual' ? x.diaMes : 0]); };
      reg.creat = clauPla(reg) === clauPla(existent) ? existent.creat : ahoText();
    }
    Object.assign(existent, reg);
    reg = existent;
  } else {
    reg.id = nouId(cat.charAt(0));
    if (ambMoments) reg.creat = ahoText();
    col.push(reg);
  }
  desar();
  anar(CATEGORIES[cat].ruta + (id ? '-llista' : ''), { tipus: 'ok', text: t('desat', { nom: titolDe(cat, reg) }) });
}

// ================= Accions (clics) =================

main.addEventListener('submit', function (e) {
  if (e.target.id === 'formulari') { e.preventDefault(); enviarFormulari(e.target); }
});

main.addEventListener('click', function (e) {
  const b = e.target.closest('[data-accio]');
  if (!b) return;
  const accio = b.getAttribute('data-accio');

  if (accio === 'tancar-missatge') {
    const m = document.getElementById('missatge');
    if (m) m.remove();
    const h1 = main.querySelector('h1'); if (h1) h1.focus();
  }
  if (accio === 'posar-data') {
    const camp = document.getElementById(b.getAttribute('data-camp'));
    camp.value = sumarDies(avuiISO(), Number(b.getAttribute('data-dies')));
    camp.removeAttribute('aria-invalid');
    const zona = document.getElementById('error-' + camp.id); if (zona) zona.innerHTML = '';
    anunciar(diaRelatiu(camp.value, true) + ', ' + dataLlarga(camp.value));
  }
  if (accio === 'esborrar') confirmarEsborrar(b.getAttribute('data-cat'), b.getAttribute('data-id'));
  if (accio === 'presa') canviarPresa(b.getAttribute('data-clau'));
  if (accio === 'treure-avis') confirmarTreureAvis(b.getAttribute('data-clau'));
  if (accio === 'fet') confirmarFet(b.getAttribute('data-clau'));
  if (accio === 'desfer-fet') desferFet(b.getAttribute('data-clau'));
});

// Medicació i exercicis: el «Fet» es marca directament (i es pot desfer). Ho comparteixen els dos botons (Fet / Desfer).
function canviarPresa(clau) {
  const o = buscarOcurrencia(dades, clau);
  const feta = !dades.preses[clau];
  if (feta) dades.preses[clau] = true; else delete dades.preses[clau];
  desar();
  focusDespres = selectorBoto('presa', clau);
  render();
  if (o) anunciar(t(feta ? 'fet_marcat' : 'fet_desmarcat', { nom: o.titol, quan: quanOcurrencia(o) }));
}

// ---------- Marcar una tasca com a feta (amb confirmació) ----------
function selectorBoto(accio, clau) { return '[data-accio="' + accio + '"][data-clau="' + clau.replace(/"/g, '\\"') + '"]'; }

function confirmarFet(clau) {
  const o = buscarOcurrencia(dades, clau);
  if (!o) return;
  const esCita = o.cat === 'cites';
  const dlg = document.getElementById('dlg-fet');
  const si = document.getElementById('fet-si');
  const no = document.getElementById('fet-no');
  const valors = { nom: o.titol, quan: quanOcurrencia(o) };
  document.getElementById('fet-titol').textContent = t(esCita ? 'fet_titol_cita' : 'fet_titol');
  document.getElementById('fet-text').textContent = t(esCita ? 'fet_text_cita' : 'fet_text', valors);
  si.innerHTML = icona('check') + esc(t('fet_si'));
  no.textContent = t('fet_no');
  const origen = document.activeElement;
  si.onclick = function () {
    dlg.close();
    if (esCita) {
      // Una cita feta desapareix de tot arreu (pantalla d'inici, «La propera cita» i «Les meves cites»).
      dades.cites = dades.cites.filter(function (c) { return c.id !== o.id; });
      ['preses', 'descartats'].forEach(function (c) {
        Object.keys(dades[c] || {}).forEach(function (k) { const p = k.split('|'); if (p[0] === 'cites' && p[1] === o.id) delete dades[c][k]; });
      });
      desar();
      focusDespres = null;
      render();
      anunciar(t('fet_marcat', valors));
      return;
    }
    dades.preses[clau] = true;
    desar();
    focusDespres = selectorBoto('desfer-fet', clau);
    render();
    anunciar(t('fet_marcat', valors));
  };
  no.onclick = function () { dlg.close(); if (origen) origen.focus(); };
  dlg.showModal();
  no.focus({ preventScroll: true });
  dlg.scrollTop = 0;
}

function desferFet(clau) {
  const o = buscarOcurrencia(dades, clau);
  delete dades.preses[clau];
  desar();
  focusDespres = selectorBoto('fet', clau);
  render();
  if (o) anunciar(t('fet_desmarcat', { nom: o.titol }));
}

// ---------- Treure de la llista amb confirmació ----------
// Només es treu aquesta vegada. El medicament, la cita o la tasca continuen guardats al seu apartat.
function confirmarTreureAvis(clau) {
  const o = buscarOcurrencia(dades, clau);
  if (!o) return;
  const dlg = document.getElementById('dlg-treure');
  const si = document.getElementById('treure-una');
  const no = document.getElementById('treure-no');
  const valors = { nom: o.titol, quan: quanOcurrencia(o), apartat: t(CATEGORIES[o.cat].nom) };

  document.getElementById('treure-titol').textContent = t('treure_titol');
  document.getElementById('treure-text').textContent = t('treure_text', valors);
  si.textContent = t('treure_si');
  no.textContent = t('treure_no');
  const origen = document.activeElement;
  si.onclick = function () {
    dlg.close();
    if (!dades.descartats) dades.descartats = {};
    dades.descartats[clau] = true;
    desar();
    anar(location.hash.replace(/^#/, '') || 'inici');  // sense missatge visible: la tasca simplement desapareix de la llista
    anunciar(t('tret_ok', valors));                    // només s'anuncia als lectors de pantalla
  };
  no.onclick = function () { dlg.close(); if (origen) origen.focus(); };
  dlg.showModal();
  no.focus({ preventScroll: true }); // l'opció segura rep el focus
  dlg.scrollTop = 0;                 // amb lletra molt gran, es comença llegint pel títol
}

// ---------- Esborrar amb confirmació ----------
function confirmarEsborrar(cat, id) {
  const r = trobar(cat, id);
  if (!r) return;
  const dlg = document.getElementById('dlg-confirmar');
  const nom = titolDe(cat, r);
  document.getElementById('confirmar-titol').textContent = t('confirmar_titol', { nom: nom });
  document.getElementById('confirmar-text').textContent = t('confirmar_text');
  const si = document.getElementById('confirmar-si');
  const no = document.getElementById('confirmar-no');
  si.innerHTML = icona('paperera') + esc(t('si_esborrar'));
  no.textContent = t('no_tornar');
  const origen = document.activeElement;
  si.onclick = function () {
    dlg.close();
    dades[CATEGORIES[cat].col] = dades[CATEGORIES[cat].col].filter(function (x) { return x.id !== id; });
    ['preses', 'descartats'].forEach(function (c) {
      Object.keys(dades[c] || {}).forEach(function (k) { const p = k.split('|'); if (p[0] === cat && p[1] === id) delete dades[c][k]; });
    });
    desar();
    anar(CATEGORIES[cat].ruta + '-llista', { tipus: 'ok', text: t('esborrat', { nom: nom }) });
  };
  no.onclick = function () { dlg.close(); if (origen) origen.focus(); };
  dlg.showModal();
  no.focus(); // l'opció segura rep el focus
}

// ================= Ajustos =================

document.getElementById('btn-ajustos').addEventListener('click', obrirAjustos);

function dibuixarAjustos() {
  const a = Object.assign({ tema: 'clar' }, dades.ajustos);
  const op = function (nom, valor, text, extra) {
    return '<label class="opcio"><input type="radio" name="' + nom + '" value="' + valor + '"' + (a[nom] === valor ? ' checked' : '') + '>' +
      '<span' + (extra ? ' lang="' + extra + '"' : '') + '>' + text + '</span></label>';
  };
  document.getElementById('ajustos-contingut').innerHTML =
    '<h2 id="ajustos-titol" class="titol-seccio">' + icona('ajustos') + esc(t('ajustos')) + '</h2>' +
    '<p class="ajuda">' + esc(t('ajustos_ajuda')) + '</p>' +
    '<fieldset class="grup-ajust"><legend>' + esc(t('idioma')) + '</legend><div class="opcions">' +
    op('idioma', 'ca', 'Català', 'ca') + op('idioma', 'es', 'Castellano', 'es') + '</div></fieldset>' +
    '<fieldset class="grup-ajust"><legend>' + esc(t('tema_text')) + '</legend><div class="opcions">' +
    op('tema', 'clar', icona('sol') + esc(t('tema_clar'))) + op('tema', 'fosc', icona('lluna') + esc(t('tema_fosc'))) + '</div></fieldset>' +
    '<fieldset class="grup-ajust"><legend>' + esc(t('mida_text')) + '</legend><div class="opcions">' +
    op('mida', 'normal', esc(t('mida_normal'))) + op('mida', 'gran', esc(t('mida_gran'))) + op('mida', 'molt-gran', esc(t('mida_molt_gran'))) + '</div></fieldset>' +
    '<div class="botons-finestra"><button type="button" class="boto boto-principal" id="ajustos-fet">' + icona('check') + esc(t('fet')) + '</button></div>';
  document.getElementById('ajustos-fet').onclick = function () { document.getElementById('dlg-ajustos').close(); };
}

function obrirAjustos() {
  const dlg = document.getElementById('dlg-ajustos');
  dibuixarAjustos();
  dlg.showModal();
  const marcat = dlg.querySelector('input:checked'); if (marcat) marcat.focus();
}

document.getElementById('dlg-ajustos').addEventListener('change', function (e) {
  if (e.target.name !== 'idioma' && e.target.name !== 'mida' && e.target.name !== 'tema') return;
  dades.ajustos[e.target.name] = e.target.value;
  desar();
  if (e.target.name === 'tema') {
    // El mode clar/fosc només canvia colors: no cal redibuixar la pantalla (així no es perd el lloc on era la persona).
    aplicarTema();
    const seleccionat = document.querySelector('#dlg-ajustos input[name="tema"][value="' + e.target.value + '"]');
    if (seleccionat) seleccionat.focus();
    return;
  }
  // Es redibuixa la pantalla de sota i la finestra, mantenint el focus a l'opció triada.
  const nom = e.target.name, valor = e.target.value;
  const formulariObert = document.getElementById('formulari');
  if (!formulariObert) { focusDespres = null; render(); }
  else actualitzarCapcalera(false);
  dibuixarAjustos();
  const sel = document.querySelector('#dlg-ajustos input[name="' + nom + '"][value="' + valor + '"]');
  if (sel) sel.focus();
});

document.getElementById('dlg-ajustos').addEventListener('close', function () {
  // Si hi havia un formulari obert, es redibuixa en el nou idioma només si està buit de canvis: el deixem tal com està.
  document.getElementById('btn-ajustos').focus({ preventScroll: true }); // així no es perd el lloc on era la persona
});

// ================= Avisos (recordatoris dins de l'aplicació) =================
// Mentre Recorda'm està obert, cada 5 segons es mira si ha arribat l'hora d'algun avís.
// Si el navegador està tancat, no hi ha avís: és un prototip web (vegeu la documentació).

let ultimaComprovacio = new Date();
const avisosMostrats = new Set();
const cuaAvisos = [];

function comprovarAvisos() {
  const ara = new Date();
  avisosVencuts(dades, ultimaComprovacio, ara).forEach(function (o) {
    if (!avisosMostrats.has(o.clau)) { avisosMostrats.add(o.clau); cuaAvisos.push(o); }
  });
  ultimaComprovacio = ara;

  const demo = llegirDemo();
  if (demo && ara.getTime() >= demo.quan) {
    esborrarDemo();
    cuaAvisos.push(buscarOcurrencia(dades, demo.clau) || exempleAvis());
  }
  mostrarSeguentAvis();
}

function exempleAvis() {
  const ara = new Date();
  const hora = dosXifres(ara.getHours()) + ':' + dosXifres(ara.getMinutes());
  return {
    cat: 'agenda', id: '', titol: t('exemple_titol'), data: avuiISO(), hora: hora, quan: ara,
    registre: { nom: t('exemple_titol'), notes: '' }, moment: '', clau: 'exemple', antelacio: 0,
  };
}

function mostrarSeguentAvis() {
  const dlg = document.getElementById('dlg-avis');
  if (!cuaAvisos.length || document.querySelector('dialog[open]')) return;
  const o = cuaAvisos.shift();
  const r = o.registre;
  const quan = quanOcurrencia(o);
  let cos = '';
  if (o.cat === 'med') cos = '<p>' + esc(t('avis_ara_presa')) + '</p><p class="avis-titol" id="avis-titol">' + esc(o.titol) + '</p><p><strong>' + esc(t('dosi_x', { x: r.dosi })) + '</strong></p><p>' + esc(majuscula(quan)) + '</p>';
  else {
    const frase = o.cat === 'cites' ? 'avis_cita' : (o.cat === 'act' ? 'avis_act' : 'avis_agenda');
    cos = '<p class="avis-titol" id="avis-titol">' + esc(o.titol) + '</p><p><strong>' + esc(t(frase, { quan: quan })) + '</strong></p>';
    const detall = detallOcurrencia(o);
    if (detall) cos += '<p>' + esc(detall) + '</p>';
  }
  const fetPossible = (o.cat === 'med' || o.cat === 'act') && o.data === avuiISO() && !dades.preses[o.clau];
  const botons = (fetPossible
    ? '<button type="button" class="boto boto-principal" id="avis-presa">' + icona('check') + esc(t('fet_boto')) + '</button>' : '') +
    '<button type="button" class="boto ' + (fetPossible ? 'boto-secundari' : 'boto-principal') + '" id="avis-dacord">' + esc(t('dacord')) + '</button>';

  dlg.className = 'finestra finestra-avis cat-' + o.cat;
  document.getElementById('avis-contingut').innerHTML =
    '<div class="avis-cap">' + icona('campana') + esc(t('avis_titol')) + '</div>' + etiquetaCat(o.cat) +
    '<div id="avis-cos">' + cos + '</div><div class="botons-finestra">' + botons + '</div>' +
    '<p class="avis-peu">' + esc(t('avis_peu')) + '</p>';
  const origen = document.activeElement;
  const tancar = function () { dlg.close(); if (origen && document.contains(origen)) origen.focus(); setTimeout(mostrarSeguentAvis, 300); };
  document.getElementById('avis-dacord').onclick = tancar;
  const presa = document.getElementById('avis-presa');
  if (presa) presa.onclick = function () {
    dades.preses[o.clau] = true; desar();
    dlg.close();
    focusDespres = null; render();
    anunciar(t('fet_marcat', { nom: o.titol, quan: quan }));
    setTimeout(mostrarSeguentAvis, 300);
  };
  dlg.showModal();
  (presa || document.getElementById('avis-dacord')).focus();
}

setInterval(comprovarAvisos, 5000);

// Cada pocs segons: posa al dia l'hora i la salutació, i si una tasca ha passat d'hora o ha canviat
// de dia, redibuixa la llista sense moure la pantalla ni perdre el botó que tenia el focus.
let vencudesConegudes = null;
function algunDialegObert() {
  return Array.prototype.some.call(document.querySelectorAll('dialog'), function (d) { return d.open; });
}
function refrescarPantalla() {
  const ara = new Date();
  const hora = document.getElementById('hora-actual-valor'); if (hora) hora.textContent = horaAra(ara);
  const salut = document.getElementById('salutacio-text'); if (salut) salut.textContent = t(claveSalutacio(ara));
  if (document.getElementById('formulari')) return;

  // Coses que acaben de passar d'hora: s'anuncien als lectors de pantalla (no a la primera passada).
  const vencudes = ocurrenciesVisibles(ara).filter(function (o) { return !dades.preses[o.clau] && o.venc <= ara; });
  if (vencudesConegudes) {
    const noves = vencudes.filter(function (o) { return !vencudesConegudes.has(o.clau); });
    if (noves.length) anunciar(t('vencuda_anunci', { nom: noves[0].titol }));
  }
  vencudesConegudes = new Set(vencudes.map(function (o) { return o.clau; }));

  if (firmaPantalla() === firmaMostrada || algunDialegObert()) return;
  const y = window.scrollY;
  const actiu = document.activeElement;
  if (actiu && main.contains(actiu) && actiu.getAttribute('data-clau')) {
    focusDespres = selectorBoto(actiu.getAttribute('data-accio'), actiu.getAttribute('data-clau'));
  }
  render();
  window.scrollTo(0, y);
}
setInterval(refrescarPantalla, 10000);
document.addEventListener('visibilitychange', function () { if (!document.hidden) refrescarPantalla(); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) comprovarAvisos(); });

// Si les dades canvien en una altra pestanya (per exemple, la pàgina d'investigadors), es recarreguen.
window.addEventListener('storage', function (e) {
  if (e.key === CLAU_DADES || e.key === null) { dades = llegirDades(); if (!document.getElementById('formulari')) render(); }
  if (e.key === CLAU_DEMO) comprovarAvisos();
});

// ================= Començar =================
document.getElementById('avis-emmagatzematge').textContent = t('avis_emmagatzematge');
(function netejarDescartats() {
  const limit = sumarDies(avuiISO(), -2);
  let canvi = false;
  Object.keys(dades.descartats || {}).forEach(function (k) {
    if ((k.split('|')[2] || '') < limit) { delete dades.descartats[k]; canvi = true; }
  });
  if (canvi) guardarDades(dades);
})();
(function () {
  try { localStorage.setItem('recordam.prova', '1'); localStorage.removeItem('recordam.prova'); }
  catch (e) { emmagatzematgeDisponible = false; }
  document.getElementById('avis-emmagatzematge').hidden = emmagatzematgeDisponible;
})();
render();
comprovarAvisos();
