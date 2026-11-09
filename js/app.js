// app.js — Pantalles, navegació, formularis i avisos de Recorda'm.
//
// Com funciona la navegació: l'adreça acaba en #... i cada valor mostra una pantalla.
//   #inici                      Inici
//   #recordatoris               Propers recordatoris (#recordatoris-7: 7 dies)
//   #medicacio                  Secció (també: cites, activitat, agenda)
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

function llistaAmbI(elements) {
  if (elements.length <= 1) return elements.join('');
  return elements.slice(0, -1).join(', ') + ' ' + CALENDARI[idioma()].i + ' ' + elements[elements.length - 1];
}

function textAntelacio(cat, minuts) {
  if (cat === 'med') return t('ant_0_med');
  return t('ant_' + minuts);
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

function render() {
  const r = ruta();
  const cat = catDeRuta(r.vista);
  let html = '';
  let titol = '';

  if (r.vista === 'recordatoris') { html = vistaRecordatoris(r.accio === '7' ? 7 : 3); titol = t('propers'); }
  else if (cat && (r.accio === 'nou' || r.accio === 'editar')) {
    const res = vistaFormulari(cat, r.accio === 'editar' ? r.id : '');
    html = res.html; titol = res.titol;
  }
  else if (cat) { html = vistaSeccio(cat); titol = t(CATEGORIES[cat].nom); }
  else { html = vistaInici(); titol = t('inici'); }

  let missatge = '';
  if (missatgeSeguent) {
    const m = missatgeSeguent;
    missatge = '<div class="missatge ' + (m.tipus === 'error' ? 'missatge-error' : 'missatge-ok') + '" id="missatge">' +
      icona(m.tipus === 'error' ? 'alerta' : 'check') + '<div class="text">' + esc(m.text) + '</div>' +
      '<button type="button" class="boto boto-secundari" data-accio="tancar-missatge">' + esc(t('tancar')) + '</button></div>';
    anunciar(m.text);
    missatgeSeguent = null;
  }

  main.innerHTML = missatge + html;
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

function actualitzarCapcalera(esInici) {
  document.documentElement.lang = idioma();
  document.documentElement.setAttribute('data-mida', dades.ajustos.mida);
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

// «Firma» de la llista de tasques: canvia quan una tasca es fa, s'esborra o li passa l'hora.
// Serveix per saber si cal redibuixar la pantalla sense que la persona hagi fet res.
let firmaMostrada = '';
function firmaTasques(dies) {
  const ara = new Date();
  return avuiISO() + '#' + tasquesProperes(dades, ara, dies).map(function (o) {
    return o.clau + (dades.preses[o.clau] ? ':F' : (o.quan <= ara ? ':V' : ':-'));
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
  const propers = tasquesProperes(dades, ara, 3);
  firmaMostrada = firmaTasques(3);
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
    '<div class="fila-botons"><a class="boto boto-secundari boto-ample" href="#recordatoris-7">' + esc(t('veure_tots')) + icona('fletxa') + '</a></div>' +
    '</section>';
}

// ================= Propers recordatoris =================

function etiquetaCat(cat) {
  return '<span class="etiqueta-cat">' + icona(CATEGORIES[cat].icona) + esc(t(CATEGORIES[cat].nom)) + '</span>';
}

function liniaAvis(cat, r) {
  if (!r.avis) return '<p class="linia linia-avis">' + icona('campana_no') + esc(t('sense_avis')) + '</p>';
  return '<p class="linia linia-avis">' + icona('campana') + esc(t('avis_x', { x: textAntelacio(cat, r.antelacio) })) + '</p>';
}

function detallOcurrencia(o) {
  const r = o.registre;
  if (o.cat === 'med') return t('dosi_x', { x: r.dosi });
  if (o.cat === 'cites') return t('lloc_x', { x: r.lloc });
  if (o.cat === 'act') return t('durada_x', { x: textDurada(r.durada) });
  return r.notes || '';
}

function botoPresa(o) {
  const feta = !!dades.preses[o.clau];
  return '<button type="button" class="boto ' + (feta ? 'boto-secundari' : 'boto-principal') + '" data-accio="presa" data-clau="' + esc(o.clau) + '">' +
    icona(feta ? 'desfer' : 'check') + esc(feta ? t('desfer') : t('ja_presa')) + '</button>';
}

function estatPresa(o) {
  const feta = !!dades.preses[o.clau];
  return feta
    ? '<span class="estat estat-feta">' + icona('check') + esc(t('feta')) + '</span>'
    : '<span class="estat estat-pendent">' + icona('rellotge') + esc(t('pendent')) + '</span>';
}

// Botó «x Treure» de cada recordatori. Només treu l'avís: no esborra el medicament, la cita ni la tasca.
function botoTreure(o) {
  return '<button type="button" class="boto boto-treure boto-compacte" data-accio="treure-avis" data-clau="' + esc(o.clau) + '" aria-label="' +
    esc(t('treure_aria', { nom: o.titol, quan: quanText(o.data, o.hora) })) + '">' +
    icona('creu') + '<span>' + esc(t('treure')) + '</span></button>';
}

// Un recordatori «es repeteix» si el registre té més d'una ocurrència (medicació, o activitat/agenda repetides).
function esRepetit(o) {
  if (o.cat === 'med') return true;
  if (o.cat === 'cites') return false;
  return !!o.registre.rep && o.registre.rep !== 'un';
}

// «Avui», «Demà» o «Dimecres 11» (curt, perquè la targeta no creixi).
function diaCurt(iso) {
  if (iso === avuiISO()) return t('today_curt');
  if (iso === sumarDies(avuiISO(), 1)) return t('tomorrow_curt');
  return nomDia(iso) + ' ' + Number(iso.slice(8, 10));
}

// Una tasca de la llista «Properes tasques»: targeta compacta amb l'hora a l'esquerra.
// L'avís vermell només surt quan ja ha passat l'hora i la tasca no està feta.
// «complet» afegeix el detall i el botó de canviar (llista de 7 dies).
function elementRecordatori(o, complet) {
  const ara = new Date();
  const feta = !!dades.preses[o.clau];
  const vencuda = !feta && o.quan <= ara;
  const detall = detallOcurrencia(o);
  const clauAttr = esc(o.clau);
  const classes = 'targeta tasca cat-' + o.cat + (feta ? ' tasca-feta' : '') + (vencuda ? ' tasca-vencuda' : '') + (complet ? ' tasca-complet' : '');

  let meta = etiquetaCat(o.cat);
  if (!complet) meta += '<span class="tasca-dia">' + esc(diaCurt(o.data)) + '</span>';
  if (feta) meta += '<span class="estat estat-feta">' + icona('check') + esc(t('fet_estat')) + '</span>';
  if (!feta && o.quan <= ara) meta += '<span class="alerta-vencuda">' + icona('alerta') + '<span>' + esc(t('vencuda')) + '</span></span>';

  let html = '<li class="' + classes + '">' +
    '<div class="tasca-hora">' + esc(horaCurta(o.hora)) + '</div>' +
    '<div class="tasca-cos">' +
      '<h3 class="tasca-titol">' + esc(o.titol) + '</h3>' +
      '<div class="tasca-meta">' + meta + '</div>';
  if (complet && detall) html += '<p class="tasca-detall">' + esc(detall) + '</p>';

  html += '</div><div class="tasca-botons">' +
    (feta
      ? '<button type="button" class="boto boto-secundari boto-compacte" data-accio="desfer-fet" data-clau="' + clauAttr + '">' + icona('desfer') + esc(t('desfer')) + '</button>'
      : '<button type="button" class="boto boto-principal boto-compacte" data-accio="fet" data-clau="' + clauAttr + '">' + icona('check') + esc(t('fet_boto')) + '</button>') +
    botoTreure(o);
  if (complet) {
    html += '<a class="boto boto-secundari boto-compacte" href="#' + CATEGORIES[o.cat].ruta + '-editar-' + encodeURIComponent(o.id) + '">' + icona('llapis') + esc(t('canviar')) + '</a>';
  }
  html += '</div></li>';
  return html;
}

function vistaRecordatoris(dies) {
  const llista = tasquesProperes(dades, new Date(), dies);
  firmaMostrada = firmaTasques(dies);
  const canvi = dies === 3
    ? '<a class="boto boto-secundari boto-ample" href="#recordatoris-7">' + esc(t('veure_7')) + icona('fletxa') + '</a>'
    : '<a class="boto boto-secundari boto-ample" href="#recordatoris">' + esc(t('veure_3')) + '</a>';
  let html = '<h1 class="titol-seccio">' + icona('campana') + esc(t('propers')) + '</h1><p class="ajuda">' + esc(t('ajuda_recordatoris', { n: dies })) + '</p>';
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
  return '<h1 class="titol-seccio cat-' + cat + '"><span class="cercle">' + icona(CATEGORIES[cat].icona) + '</span>' + esc(t(CATEGORIES[cat].nom)) + '</h1>' +
    '<p class="ajuda">' + esc(t('ajuda_' + cat)) + '</p>' +
    '<a class="boto boto-principal boto-ample" href="#' + CATEGORIES[cat].ruta + '-nou">' + icona('mes') + esc(t('afegir_' + cat)) + '</a>';
}

function botonsTargeta(cat, r) {
  return '<div class="fila-botons">' +
    '<a class="boto boto-secundari" href="#' + CATEGORIES[cat].ruta + '-editar-' + encodeURIComponent(r.id) + '">' + icona('llapis') + esc(t('canviar')) + '<span class="visualment-amagat">: ' + esc(titolDe(cat, r)) + '</span></a>' +
    '<button type="button" class="boto boto-perill-suau" data-accio="esborrar" data-cat="' + cat + '" data-id="' + esc(r.id) + '">' + icona('paperera') + esc(t('esborrar')) + '<span class="visualment-amagat">: ' + esc(titolDe(cat, r)) + '</span></button>' +
    '</div>';
}

function targeta(cat, r, extra) {
  return '<li class="targeta cat-' + cat + (extra && extra.passat ? ' passat' : '') + '"><h3>' + esc(titolDe(cat, r)) + '</h3>' + (extra && extra.linies || '') + liniaAvis(cat, r) + botonsTargeta(cat, r) + '</li>';
}

function linia(text, negreta) { return text ? '<p class="linia">' + (negreta ? '<strong>' + esc(text) + '</strong>' : esc(text)) + '</p>' : ''; }

function nomsDies(dies) {
  return llistaAmbI(dies.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (d) { return CALENDARI[idioma()].dies[d]; }));
}

function textRepeticio(rep, r) {
  if (rep === 'diari') return t('es_repeteix_diari');
  if (rep === 'setmanal') return t('es_repeteix_setmanal');
  if (rep === 'dies' && r) return t('es_repeteix_dies', { x: nomsDies(r.dies || []) });
  return '';
}

function vistaSeccio(cat) {
  const ara = new Date();
  let html = capSeccio(cat);

  if (cat === 'med') {
    const preses = ocurrencies(dades, crearData(avuiISO(), '00:00'), crearData(avuiISO(), '23:59'))
      .filter(function (o) { return o.cat === 'med'; });
    html += '<h2>' + esc(t('preses_avui')) + '</h2>';
    html += preses.length ? '<ul class="llista">' + preses.map(function (o) {
      return '<li class="targeta cat-med"><div class="presa"><div class="dades-presa"><h3>' + esc(horaCurta(o.hora)) + ' · ' + esc(o.titol) + '</h3>' +
        '<p class="linia">' + esc(t('dosi_x', { x: o.registre.dosi })) + '</p><p class="linia">' + estatPresa(o) + '</p></div>' + botoPresa(o) + '</div></li>';
    }).join('') + '</ul>' : '<p class="buit">' + esc(t('cap_presa_avui')) + '</p>';

    html += '<h2>' + esc(t('meus_med')) + '</h2>';
    if (!dades.medicaments.length) return html + '<p class="buit">' + esc(t('cap_med')) + '</p>';
    const meds = dades.medicaments.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom); });
    return html + '<ul class="llista">' + meds.map(function (m) {
      const dies = m.freq === 'dies'
        ? t('dies_x', { x: llistaAmbI(m.dies.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (d) { return CALENDARI[idioma()].dies[d]; })) })
        : t('cada_dia');
      const periode = m.fi ? t('des_de_fins', { x: dataLlarga(m.inici), y: dataLlarga(m.fi) }) : t('des_de_x', { x: dataLlarga(m.inici) });
      const acabat = m.fi && m.fi < avuiISO();
      return targeta('med', m, {
        passat: acabat,
        linies: linia(t('dosi_x', { x: m.dosi })) + linia(t('hores_x', { x: llistaAmbI(m.hores.slice().sort().map(horaCurta)) })) + linia(dies) + linia(periode) + (acabat ? linia(t('finalitzat'), true) : ''),
      });
    }).join('') + '</ul>';
  }

  if (cat === 'cites') {
    const totes = dades.cites.slice().sort(function (a, b) { return crearData(a.data, a.hora) - crearData(b.data, b.hora); });
    const futures = totes.filter(function (c) { return crearData(c.data, c.hora) >= ara; });
    const passades = totes.filter(function (c) { return crearData(c.data, c.hora) < ara; }).reverse();
    const fitxa = function (c, passat) {
      return targeta('cites', c, { passat: passat, linies: linia(t('a_les', { dia: diaRelatiu(c.data, true), hora: horaCurta(c.hora) }), true) + linia(t('lloc_x', { x: c.lloc })) + linia(c.obs) });
    };
    html += '<h2>' + esc(t('properes_cites')) + '</h2>';
    html += futures.length ? '<ul class="llista">' + futures.map(function (c) { return fitxa(c, false); }).join('') + '</ul>' : '<p class="buit">' + esc(t('cap_cita')) + '</p>';
    if (passades.length) html += '<h2>' + esc(t('cites_passades')) + '</h2><ul class="llista">' + passades.map(function (c) { return fitxa(c, true); }).join('') + '</ul>';
    return html;
  }

  if (cat === 'act') {
    const setmana = ocurrencies(dades, ara, crearData(sumarDies(avuiISO(), 6), '23:59')).filter(function (o) { return o.cat === 'act'; });
    html += '<h2>' + esc(t('aquesta_setmana')) + '</h2>';
    html += setmana.length ? '<ul class="llista">' + setmana.map(function (o) {
      return '<li class="targeta cat-act"><h3>' + esc(o.titol) + '</h3>' + linia(t('a_les', { dia: diaRelatiu(o.data, true), hora: horaCurta(o.hora) }), true) + linia(t('durada_x', { x: textDurada(o.registre.durada) })) + '</li>';
    }).join('') + '</ul>' : '<p class="buit">' + esc(t('cap_act_setmana')) + '</p>';
    html += '<h2>' + esc(t('meves_act')) + '</h2>';
    if (!dades.activitats.length) return html + '<p class="buit">' + esc(t('cap_act')) + '</p>';
    return html + '<ul class="llista">' + ordenarPerPropera('act', dades.activitats).map(function (x) {
      const r = x.r, p = x.propera;
      return targeta('act', r, {
        passat: !p,
        linies: (p ? linia(t('propera_vegada', { x: quanText(p.data, p.hora) }), true) : linia(t('finalitzat'), true)) +
          linia(t('durada_x', { x: textDurada(r.durada) })) + linia(textRepeticio(r.rep, r)),
      });
    }).join('') + '</ul>';
  }

  // Agenda
  html += '<h2>' + esc(t('properes_agenda')) + '</h2>';
  if (!dades.agenda.length) return html + '<p class="buit">' + esc(t('cap_agenda')) + '</p>';
  const ordenades = ordenarPerPropera('agenda', dades.agenda);
  const futures = ordenades.filter(function (x) { return x.propera; });
  const passades = ordenades.filter(function (x) { return !x.propera; });
  const fitxa = function (x) {
    const r = x.r, p = x.propera;
    return targeta('agenda', r, {
      passat: !p,
      linies: (p ? linia(t('a_les', { dia: diaRelatiu(p.data, true), hora: horaCurta(p.hora) }), true) : linia(t('a_les', { dia: diaRelatiu(r.data, true), hora: horaCurta(r.hora) }), true)) +
        linia(r.notes) + linia(textRepeticio(r.rep, r)),
    });
  };
  html += futures.length ? '<ul class="llista">' + futures.map(fitxa).join('') + '</ul>' : '<p class="buit">' + esc(t('cap_agenda')) + '</p>';
  if (passades.length) html += '<h2>' + esc(t('agenda_passades')) + '</h2><ul class="llista">' + passades.map(fitxa).join('') + '</ul>';
  return html;
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
    : '<input type="text" id="' + nom + '" name="' + nom + '" value="' + esc(valor) + '" autocomplete="off" aria-describedby="' + descr + '"' + (opts.oblig ? ' aria-required="true"' : '') + '>';
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

function campAvis(cat, r) {
  const actiu = r.avis !== false;
  let html = '<div class="camp"><label class="opcio"><input type="checkbox" name="avis" id="avis"' + (actiu ? ' checked' : '') + '>' +
    '<span>' + icona('campana') + ' ' + esc(cat === 'med' ? t('med_avis') : t('vull_avis')) + '</span></label></div>';
  if (cat !== 'med') {
    const opcions = ANTELACIONS[cat].map(function (m) { return { valor: m, text: t('ant_' + m) }; });
    html += grupOpcions('antelacio', t('quan_avis'), opcions, r.antelacio != null ? r.antelacio : ANTELACIONS[cat][0], true, 'grup-antelacio' + (actiu ? '' : ' amagat'));
  }
  return html;
}

function filaHora(n, valor, potTreure) {
  return '<div class="fila-hora"><label class="visualment-amagat" for="hora-' + n + '">' + esc(t('med_hora_n', { n: n })) + '</label>' +
    '<input type="time" id="hora-' + n + '" name="hora" value="' + esc(valor) + '" aria-describedby="error-hores">' +
    (potTreure ? '<button type="button" class="boto boto-perill-suau" data-accio="treure-hora" aria-label="' + esc(t('treure_hora', { n: n })) + '">' + icona('paperera') + '</button>' : '') + '</div>';
}

function vistaFormulari(cat, id) {
  const editant = !!id;
  const r = editant ? trobar(cat, id) : null;
  if (editant && !r) {
    missatgeSeguent = { tipus: 'error', text: t('no_trobat') };
    return { html: vistaSeccio(cat), titol: t(CATEGORIES[cat].nom) };
  }
  const v = r || valorsPerDefecte(cat);
  const titol = t((editant ? 'canviar_' : 'afegir_') + cat);
  const textDesar = editant ? t('desar_canvis') : t('desar');

  let camps = '';
  if (cat === 'med') {
    const dies = [1, 2, 3, 4, 5, 6, 0];
    camps += campText('nom', t('med_nom'), v.nom, { oblig: true, ajuda: t('med_nom_ajuda') });
    camps += campText('dosi', t('med_dosi'), v.dosi, { oblig: true, ajuda: t('med_dosi_ajuda') });
    camps += '<fieldset id="grup-hores" aria-describedby="error-hores"><legend>' + etiquetaCamp(t('med_hores'), true) + '</legend><div id="llista-hores">' +
      v.hores.map(function (h, i) { return filaHora(i + 1, h, v.hores.length > 1); }).join('') + '</div>' +
      '<div id="error-hores"></div>' +
      '<button type="button" class="boto boto-secundari" data-accio="afegir-hora">' + icona('mes') + esc(t('afegir_hora')) + '</button></fieldset>';
    camps += grupOpcions('freq', t('med_freq'), [{ valor: 'diari', text: t('freq_diari') }, { valor: 'dies', text: t('freq_dies') }], v.freq, true);
    camps += '<fieldset id="grup-dies" class="' + (v.freq === 'dies' ? '' : 'amagat') + '" aria-describedby="error-dies"><legend>' + etiquetaCamp(t('med_dies'), true) + '</legend><div class="opcions">' +
      dies.map(function (d) {
        return '<label class="opcio"><input type="checkbox" name="dies" value="' + d + '"' + (v.dies.indexOf(d) > -1 ? ' checked' : '') + '><span>' + esc(CALENDARI[idioma()].dies[d]) + '</span></label>';
      }).join('') + '</div><div id="error-dies"></div></fieldset>';
    camps += campData('inici', t('med_inici'), v.inici, true);
    camps += campData('fi', t('med_fi'), v.fi, false, t('med_fi_ajuda'));
  } else if (cat === 'cites') {
    camps += campText('motiu', t('cita_motiu'), v.motiu, { oblig: true, ajuda: t('cita_motiu_ajuda') });
    camps += campData('data', t('data'), v.data, true);
    camps += campHora('hora', t('hora'), v.hora);
    camps += campText('lloc', t('cita_lloc'), v.lloc, { oblig: true, ajuda: t('cita_lloc_ajuda') });
    camps += campText('obs', t('cita_obs'), v.obs, { multilinia: true, ajuda: t('cita_obs_ajuda') });
  } else if (cat === 'act') {
    camps += campText('nom', t('act_nom'), v.nom, { oblig: true, ajuda: t('act_nom_ajuda') });
    camps += campData('data', t('data'), v.data, true);
    camps += campHora('hora', t('hora'), v.hora);
    const altra = DURADES.indexOf(Number(v.durada)) === -1;
    camps += grupOpcions('durada', t('act_durada'), DURADES.map(function (m) { return { valor: m, text: textDurada(m) }; }).concat([{ valor: 'altra', text: t('durada_altra') }]), altra ? 'altra' : v.durada, true);
    camps += '<div class="camp' + (altra ? '' : ' amagat') + '" id="camp-minuts"><label for="minuts">' + etiquetaCamp(t('durada_minuts'), true) + '</label>' +
      '<p class="ajuda" id="ajuda-minuts">' + esc(t('durada_minuts_ajuda')) + '</p>' +
      '<input type="text" inputmode="numeric" pattern="[0-9]*" id="minuts" name="minuts" value="' + (altra ? esc(v.durada) : '') + '" autocomplete="off" aria-describedby="ajuda-minuts error-minuts"><div id="error-minuts"></div></div>';
    camps += campsRepeticio(v);
  } else {
    camps += campText('nom', t('agenda_nom'), v.nom, { oblig: true, ajuda: t('agenda_nom_ajuda') });
    camps += campData('data', t('data'), v.data, true);
    camps += campHora('hora', t('hora'), v.hora);
    camps += campText('notes', t('agenda_notes'), v.notes, { multilinia: true });
    camps += campsRepeticio(v);
  }
  camps += campAvis(cat, v);

  const html = '<h1 class="titol-seccio cat-' + cat + '"><span class="cercle">' + icona(CATEGORIES[cat].icona) + '</span>' + esc(titol) + '</h1>' +
    '<p class="ajuda">' + esc(t('instruccio_form', { desar: textDesar })) + '</p>' +
    '<form id="formulari" novalidate data-cat="' + cat + '" data-id="' + esc(id) + '">' +
    '<div id="resum-errors"></div>' + camps +
    '<div class="botons-form"><button type="submit" class="boto boto-principal">' + icona('check') + esc(textDesar) + '</button>' +
    '<a class="boto boto-secundari" href="#' + CATEGORIES[cat].ruta + '">' + esc(t('cancelar')) + '</a></div></form>';
  return { html: html, titol: titol };
}

// «Es repeteix?» amb opcions ràpides i una opció lliure: triar els dies de la setmana.
function campsRepeticio(v) {
  const dies = [1, 2, 3, 4, 5, 6, 0];
  const marcats = v.dies || [];
  let html = grupOpcions('rep', t('repeticio'), [
    { valor: 'un', text: t('rep_un') }, { valor: 'diari', text: t('rep_diari') }, { valor: 'setmanal', text: t('rep_setmanal') },
    { valor: 'dies', text: t('rep_dies') },
  ], v.rep, true);
  html += '<fieldset id="grup-repdies" class="' + (v.rep === 'dies' ? '' : 'amagat') + '" aria-describedby="error-repdies"><legend>' + etiquetaCamp(t('med_dies'), true) + '</legend><div class="opcions">' +
    dies.map(function (d) {
      return '<label class="opcio"><input type="checkbox" name="repdies" value="' + d + '"' + (marcats.indexOf(d) > -1 ? ' checked' : '') + '><span>' + esc(CALENDARI[idioma()].dies[d]) + '</span></label>';
    }).join('') + '</div><div id="error-repdies"></div></fieldset>';
  return html;
}

function valorsPerDefecte(cat) {
  const avui = avuiISO();
  if (cat === 'med') return { nom: '', dosi: '', hores: [''], freq: 'diari', dies: [], inici: avui, fi: '', avis: true };
  if (cat === 'cites') return { motiu: '', data: '', hora: '', lloc: '', obs: '', avis: true, antelacio: ANTELACIONS.cites[0] };
  if (cat === 'act') return { nom: '', data: '', hora: '', durada: 30, rep: 'un', avis: true, antelacio: ANTELACIONS.act[0] };
  return { nom: '', data: '', hora: '', notes: '', rep: 'un', avis: true, antelacio: ANTELACIONS.agenda[0] };
}

// Mostra o amaga parts del formulari segons el que es tria.
function prepararFormulari() {
  const form = document.getElementById('formulari');
  if (!form) return;
  form.addEventListener('change', function (e) {
    if (e.target.name === 'freq') document.getElementById('grup-dies').classList.toggle('amagat', e.target.value !== 'dies');
    if (e.target.name === 'rep') {
      document.getElementById('grup-repdies').classList.toggle('amagat', e.target.value !== 'dies');
    }
    if (e.target.name === 'durada') document.getElementById('camp-minuts').classList.toggle('amagat', e.target.value !== 'altra');
    if (e.target.name === 'avis') {
      const g = form.querySelector('.grup-antelacio');
      if (g) g.classList.toggle('amagat', !e.target.checked);
    }
  });
}

function renumerarHores() {
  const files = document.querySelectorAll('#llista-hores .fila-hora');
  files.forEach(function (fila, i) {
    const n = i + 1;
    fila.querySelector('label').textContent = t('med_hora_n', { n: n });
    fila.querySelector('label').setAttribute('for', 'hora-' + n);
    fila.querySelector('input').id = 'hora-' + n;
    let boto = fila.querySelector('[data-accio="treure-hora"]');
    if (files.length > 1 && !boto) {
      fila.insertAdjacentHTML('beforeend', '<button type="button" class="boto boto-perill-suau" data-accio="treure-hora">' + icona('paperera') + '</button>');
      boto = fila.querySelector('[data-accio="treure-hora"]');
    }
    if (files.length === 1 && boto) { boto.remove(); boto = null; }
    if (boto) boto.setAttribute('aria-label', t('treure_hora', { n: n }));
  });
}

function mostrarError(form, nom, text) {
  const zona = form.querySelector('#error-' + nom);
  if (zona) zona.innerHTML = '<p class="error-camp">' + icona('alerta') + '<span>' + esc(text) + '</span></p>';
  const control = form.querySelector('#' + nom) || form.querySelector('#grup-' + nom + ' input');
  if (nom === 'hores') form.querySelectorAll('input[name="hora"]').forEach(function (i) { if (!esHoraValida(i.value)) i.setAttribute('aria-invalid', 'true'); });
  else if (control && control.type !== 'radio' && control.type !== 'checkbox') control.setAttribute('aria-invalid', 'true');
}

function netejarErrors(form) {
  form.querySelectorAll('[id^="error-"]').forEach(function (z) { z.innerHTML = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
  form.querySelector('#resum-errors').innerHTML = '';
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
  const avis = f.get('avis') === 'on';
  const antelacio = Number(f.get('antelacio'));

  if (cat === 'med') {
    const hores = f.getAll('hora').map(String).filter(function (h) { return h; });
    const dies = f.getAll('dies').map(Number);
    reg = { nom: val('nom'), dosi: val('dosi'), hores: hores, freq: val('freq') || 'diari', dies: dies, inici: val('inici'), fi: val('fi'), avis: avis };
    if (!reg.nom) err('nom', 'err_med_nom');
    if (!reg.dosi) err('dosi', 'err_med_dosi');
    if (!hores.length || hores.some(function (h) { return !esHoraValida(h); })) err('hores', 'err_hores');
    if (reg.freq === 'dies' && !dies.length) err('dies', 'err_dies');
    if (!esDataValida(reg.inici)) err('inici', 'err_data');
    if (reg.fi && !esDataValida(reg.fi)) err('fi', 'err_data');
    else if (reg.fi && esDataValida(reg.inici) && reg.fi < reg.inici) err('fi', 'err_fi');
    reg.hores = Array.from(new Set(hores)).sort();
    if (reg.freq !== 'dies') reg.dies = [];
  } else if (cat === 'cites') {
    reg = { motiu: val('motiu'), data: val('data'), hora: val('hora'), lloc: val('lloc'), obs: val('obs'), avis: avis, antelacio: antelacio };
    if (!reg.motiu) err('motiu', 'err_cita_motiu');
    if (!esDataValida(reg.data)) err('data', 'err_data');
    if (!esHoraValida(reg.hora)) err('hora', 'err_hora');
    if (!reg.lloc) err('lloc', 'err_cita_lloc');
  } else {
    reg = { nom: val('nom'), data: val('data'), hora: val('hora'), rep: val('rep') || 'un', dies: [], avis: avis, antelacio: antelacio };
    if (!reg.nom) err('nom', cat === 'act' ? 'err_act_nom' : 'err_agenda_nom');
    if (!esDataValida(reg.data)) err('data', 'err_data');
    if (!esHoraValida(reg.hora)) err('hora', 'err_hora');
    if (cat === 'act') {
      if (val('durada') === 'altra') {
        const m = val('minuts');
        if (!/^\d+$/.test(m) || Number(m) < 1 || Number(m) > 720) err('minuts', 'err_minuts');
        else reg.durada = Number(m);
      } else reg.durada = Number(val('durada')) || 30;
    } else reg.notes = val('notes');
    if (reg.rep === 'dies') {
      reg.dies = f.getAll('repdies').map(Number);
      if (!reg.dies.length) err('repdies', 'err_dies');
    }
  }
  if (cat !== 'med' && avis && ANTELACIONS[cat].indexOf(antelacio) === -1) err('antelacio', 'err_avis');

  if (errors.length) {
    form.querySelector('#resum-errors').innerHTML = '<div class="missatge missatge-error" role="alert">' + icona('alerta') + '<div class="text">' + esc(t('revisa')) + '</div></div>';
    const primer = errors[0];
    const control = form.querySelector('#' + primer) || form.querySelector('#grup-' + primer + ' input') || form.querySelector('input[name="hora"]');
    if (control) control.focus();
    return;
  }

  const col = dades[CATEGORIES[cat].col];
  if (id) {
    const existent = trobar(cat, id);
    if (!existent) { anar(CATEGORIES[cat].ruta, { tipus: 'error', text: t('no_trobat') }); return; }
    Object.assign(existent, reg);
    reg = existent;
  } else {
    reg.id = nouId(cat.charAt(0));
    col.push(reg);
  }
  desar();

  const nom = titolDe(cat, reg);
  let text;
  if (!reg.avis) text = t('desat_sense_avis', { nom: nom });
  else {
    const p = primerAvis(dades, cat, reg.id, new Date());
    text = p ? t('desat_amb_avis', { nom: nom, quan: quanText(dataISO(p.avisQuan), dosXifres(p.avisQuan.getHours()) + ':' + dosXifres(p.avisQuan.getMinutes())) })
      : t('desat_avis_passat', { nom: nom });
  }
  anar(CATEGORIES[cat].ruta, { tipus: 'ok', text: text });
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
  if (accio === 'afegir-hora') {
    const llista = document.getElementById('llista-hores');
    const n = llista.querySelectorAll('.fila-hora').length + 1;
    llista.insertAdjacentHTML('beforeend', filaHora(n, '', true));
    renumerarHores();
    document.getElementById('hora-' + n).focus();
  }
  if (accio === 'treure-hora') {
    b.closest('.fila-hora').remove();
    renumerarHores();
    const primer = document.querySelector('#llista-hores input'); if (primer) primer.focus();
  }
  if (accio === 'esborrar') confirmarEsborrar(b.getAttribute('data-cat'), b.getAttribute('data-id'));
  if (accio === 'presa') canviarPresa(b.getAttribute('data-clau'));
  if (accio === 'treure-avis') confirmarTreureAvis(b.getAttribute('data-clau'));
  if (accio === 'fet') confirmarFet(b.getAttribute('data-clau'));
  if (accio === 'desfer-fet') desferFet(b.getAttribute('data-clau'));
});

function canviarPresa(clau) {
  const parts = clau.split('|');
  const med = trobar('med', parts[1]);
  const feta = !dades.preses[clau];
  if (feta) dades.preses[clau] = true; else delete dades.preses[clau];
  desar();
  const nom = med ? med.nom : '';
  focusDespres = '[data-accio="presa"][data-clau="' + clau.replace(/"/g, '\\"') + '"]';
  render();
  anunciar(t(feta ? 'presa_marcada' : 'presa_desfeta', { nom: nom, hora: horaCurta(parts[3]) }));
}

// ---------- Marcar una tasca com a feta (amb confirmació) ----------
function selectorBoto(accio, clau) { return '[data-accio="' + accio + '"][data-clau="' + clau.replace(/"/g, '\\"') + '"]'; }

function confirmarFet(clau) {
  const o = buscarOcurrencia(dades, clau);
  if (!o) return;
  const dlg = document.getElementById('dlg-fet');
  const si = document.getElementById('fet-si');
  const no = document.getElementById('fet-no');
  const valors = { nom: o.titol, quan: quanText(o.data, o.hora) };
  document.getElementById('fet-titol').textContent = t('fet_titol');
  document.getElementById('fet-text').textContent = t('fet_text', valors);
  si.innerHTML = icona('check') + esc(t('fet_si'));
  no.textContent = t('fet_no');
  const origen = document.activeElement;
  si.onclick = function () {
    dlg.close();
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

// ---------- Treure un recordatori amb confirmació ----------
// Només es treu l'avís. El medicament, la cita o la tasca continuen guardats al seu apartat.
function confirmarTreureAvis(clau) {
  const o = buscarOcurrencia(dades, clau);
  if (!o) return;
  const dlg = document.getElementById('dlg-treure');
  const una = document.getElementById('treure-una');
  const totes = document.getElementById('treure-totes');
  const no = document.getElementById('treure-no');
  const rep = esRepetit(o);
  const valors = { nom: o.titol, quan: quanText(o.data, o.hora), apartat: t(CATEGORIES[o.cat].nom) };

  document.getElementById('treure-titol').textContent = t('treure_titol');
  document.getElementById('treure-text').textContent = t(rep ? 'treure_text_rep' : 'treure_text_un', valors);
  una.textContent = t(rep ? 'treure_una' : 'treure_si');
  totes.textContent = t('treure_totes');
  totes.hidden = !rep;
  no.textContent = t('treure_no');
  const origen = document.activeElement;
  const sortir = function (missatge) {
    dlg.close();
    desar();
    anar(location.hash.replace(/^#/, '') || 'inici');  // sense missatge visible: la tasca simplement desapareix de la llista
    anunciar(missatge);                                // només s'anuncia als lectors de pantalla
  };

  una.onclick = function () {
    if (rep) {
      if (!dades.descartats) dades.descartats = {};
      dades.descartats[clau] = true;
      sortir(t('avis_tret_una', valors));
    } else {
      o.registre.avis = false;
      sortir(t('avis_tret_tots', valors));
    }
  };
  totes.onclick = function () { o.registre.avis = false; sortir(t('avis_tret_tots', valors)); };
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
    if (cat === 'med') Object.keys(dades.preses).forEach(function (k) { if (k.split('|')[1] === id) delete dades.preses[k]; });
    desar();
    anar(CATEGORIES[cat].ruta, { tipus: 'ok', text: t('esborrat', { nom: nom }) });
  };
  no.onclick = function () { dlg.close(); if (origen) origen.focus(); };
  dlg.showModal();
  no.focus(); // l'opció segura rep el focus
}

// ================= Ajustos =================

document.getElementById('btn-ajustos').addEventListener('click', obrirAjustos);

function dibuixarAjustos() {
  const a = dades.ajustos;
  const op = function (nom, valor, text, extra) {
    return '<label class="opcio"><input type="radio" name="' + nom + '" value="' + valor + '"' + (a[nom] === valor ? ' checked' : '') + '>' +
      '<span' + (extra ? ' lang="' + extra + '"' : '') + '>' + text + '</span></label>';
  };
  document.getElementById('ajustos-contingut').innerHTML =
    '<h2 id="ajustos-titol" class="titol-seccio">' + icona('ajustos') + esc(t('ajustos')) + '</h2>' +
    '<p class="ajuda">' + esc(t('ajustos_ajuda')) + '</p>' +
    '<fieldset class="grup-ajust"><legend>' + esc(t('idioma')) + '</legend><div class="opcions">' +
    op('idioma', 'ca', 'Català', 'ca') + op('idioma', 'es', 'Castellano', 'es') + '</div></fieldset>' +
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
  if (e.target.name !== 'idioma' && e.target.name !== 'mida') return;
  dades.ajustos[e.target.name] = e.target.value;
  desar();
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
  document.getElementById('btn-ajustos').focus();
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
    registre: { nom: t('exemple_titol'), notes: '', avis: true, antelacio: 0 }, clau: 'exemple', antelacio: 0,
  };
}

function mostrarSeguentAvis() {
  const dlg = document.getElementById('dlg-avis');
  if (!cuaAvisos.length || document.querySelector('dialog[open]')) return;
  const o = cuaAvisos.shift();
  const r = o.registre;
  const quan = quanText(o.data, o.hora);
  let cos = '';
  if (o.cat === 'med') cos = '<p>' + esc(t('avis_ara_presa')) + '</p><p class="avis-titol" id="avis-titol">' + esc(o.titol) + '</p><p><strong>' + esc(t('dosi_x', { x: r.dosi })) + '</strong></p><p>' + esc(t('hora_x', { hora: horaCurta(o.hora) })) + '</p>';
  else {
    const frase = o.cat === 'cites' ? 'avis_cita' : (o.cat === 'act' ? 'avis_act' : 'avis_agenda');
    cos = '<p class="avis-titol" id="avis-titol">' + esc(o.titol) + '</p><p><strong>' + esc(t(frase, { quan: quan })) + '</strong></p>';
    const detall = detallOcurrencia(o);
    if (detall) cos += '<p>' + esc(detall) + '</p>';
    if (o.cat === 'cites' && r.obs) cos += '<p>' + esc(r.obs) + '</p>';
  }
  const botons = (o.cat === 'med' && o.data === avuiISO() && !dades.preses[o.clau]
    ? '<button type="button" class="boto boto-principal" id="avis-presa">' + icona('check') + esc(t('ja_presa')) + '</button>' : '') +
    '<button type="button" class="boto ' + (o.cat === 'med' ? 'boto-secundari' : 'boto-principal') + '" id="avis-dacord">' + esc(t('dacord')) + '</button>';

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
    anunciar(t('presa_marcada', { nom: o.titol, hora: horaCurta(o.hora) }));
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

  const r = ruta();
  const esTasques = r.vista === 'recordatoris' || (!catDeRuta(r.vista) && r.vista !== 'recordatoris');
  if (!esTasques || document.getElementById('formulari')) return;
  const dies = r.vista === 'recordatoris' ? (r.accio === '7' ? 7 : 3) : 3;

  // Tasques que acaben de passar d'hora: s'anuncien als lectors de pantalla (no a la primera passada).
  const vencudes = tasquesProperes(dades, ara, dies).filter(function (o) { return !dades.preses[o.clau] && o.quan <= ara; });
  if (vencudesConegudes) {
    const noves = vencudes.filter(function (o) { return !vencudesConegudes.has(o.clau); });
    if (noves.length) anunciar(t('vencuda_anunci', { nom: noves[0].titol, hora: horaCurta(noves[0].hora) }));
  }
  vencudesConegudes = new Set(vencudes.map(function (o) { return o.clau; }));

  if (firmaTasques(dies) === firmaMostrada || algunDialegObert()) return;
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
