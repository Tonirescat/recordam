// tema.js — S'executa abans de pintar la pàgina: si la persona havia triat el mode fosc, s'aplica de seguida
// (així no es veu un instant la pantalla clara). La resta del tema es gestiona a app.js.
(function () {
  try {
    var d = JSON.parse(localStorage.getItem('recordam.v1'));
    if (d && d.ajustos && d.ajustos.tema === 'fosc') {
      document.documentElement.setAttribute('data-tema', 'fosc');
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', '#12151A');
    }
  } catch (e) { /* si no es pot llegir, es queda el mode clar */ }
})();
