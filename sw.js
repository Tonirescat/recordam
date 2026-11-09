// sw.js — Service worker de Recorda'm.
// Objectiu: que l'aplicació es pugui instal·lar i s'obri també sense connexió.
//
// Estratègia: «xarxa primer, còpia desada com a recurs de reserva».
//  - Amb connexió, sempre es descarrega la versió més nova dels fitxers (així, quan els
//    investigadors pugen un canvi, el veuen de seguida).
//  - Sense connexió, s'utilitza l'última còpia desada.
// Les dades de la persona (localStorage) no passen mai pel service worker.
//
// IMPORTANT: quan canvieu l'estructura de fitxers, pugeu el número de VERSIO.

const VERSIO = 'v7';
const CACHE = 'recordam-' + VERSIO;
const FITXERS = [
  './',
  'index.html',
  'investigadors.html',
  'manifest.webmanifest',
  'css/estils.css',
  'js/textos.js',
  'js/dades.js',
  'js/recordatoris.js',
  'js/app.js',
  'js/pwa.js',
  'icones/icona-192.png',
  'icones/icona-512.png',
  'icones/icona-maskable-512.png',
  'icones/apple-touch-icon.png',
  'icones/favicon-32.png',
  'icones/logo.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(FITXERS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (claus) {
        return Promise.all(claus.filter(function (k) { return k.indexOf('recordam-') === 0 && k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const peticio = e.request;
  if (peticio.method !== 'GET') return;
  const url = new URL(peticio.url);
  if (url.origin !== self.location.origin) return; // només els fitxers propis

  e.respondWith(
    fetch(peticio)
      .then(function (resposta) {
        if (resposta && resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then(function (c) { c.put(peticio, copia); });
        }
        return resposta;
      })
      .catch(function () {
        return caches.match(peticio, { ignoreSearch: true }).then(function (guardat) {
          if (guardat) return guardat;
          if (peticio.mode === 'navigate') return caches.match('index.html');
          return Response.error();
        });
      })
  );
});
