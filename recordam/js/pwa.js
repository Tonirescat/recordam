// pwa.js — Registra el service worker perquè Recorda'm es pugui instal·lar i funcioni sense connexió.
// Només funciona des d'una adreça https (o localhost). Si s'obre el fitxer directament
// (file://), no fa res i l'aplicació funciona igual que abans.

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* res: l'aplicació funciona sense instal·lar-se */ });
  });
}
