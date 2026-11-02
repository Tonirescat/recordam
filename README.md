# Recorda'm — Prototip V1 (PWA)

Prototip web interactiu per a l'avaluació de la usabilitat amb persones de 65 anys o més.
Projecte de final de cicle (CFGS Imatge per al Diagnòstic i Medicina Nuclear).

No és una aplicació sanitària: no diagnostica, no recomana tractaments i no es connecta a cap servei.
Utilitzeu només dades fictícies.

## Què hi ha a la carpeta

| Fitxer | Què fa |
| --- | --- |
| `index.html` | L'aplicació (Inici, Medicació, Cites mèdiques, Activitat física, Agenda, Propers recordatoris) |
| `investigadors.html` | Pàgina per als investigadors: reiniciar dades i mostrar avisos de prova. No té cap enllaç des de l'aplicació |
| `css/estils.css` | Colors, mides i adaptació a pantalles |
| `js/textos.js` | Tots els textos en català i castellà |
| `js/dades.js` | Guardar i llegir les dades (localStorage) i estat inicial de proves |
| `js/recordatoris.js` | Càlcul de les dates dels recordatoris |
| `js/app.js` | Pantalles, formularis, navegació i avisos |
| `manifest.webmanifest` | Nom, colors i icones de l'aplicació instal·lada (PWA) |
| `sw.js` | Service worker: desa una còpia dels fitxers perquè s'obri també sense connexió |
| `js/pwa.js` | Registra el service worker (només des d'una adreça https) |
| `icones/` | Icones de l'aplicació (192 i 512 px, versió *maskable*, icona d'Apple i favicon) |

No cal instal·lar res ni compilar res: són fitxers HTML, CSS i JavaScript.
Si s'obre amb doble clic (adreça `file://`) funciona igual, però sense les parts de PWA (instal·lació i ús sense connexió), que només van des d'una adreça https.

## Obrir-lo a l'ordinador

1. Descomprimiu la carpeta `recordam`.
2. Feu doble clic a `index.html`. S'obrirà al navegador.
3. Per veure'l com en un mòbil: a Chrome o Edge, premeu F12 i després la icona del mòbil (o Ctrl+Maj+M), i trieu una mida, per exemple 390 × 844.

## Publicar-lo en una adreça web (per provar-lo en mòbils i tauletes)

Opció recomanada: **GitHub Pages** (gratuït).

1. Creeu un compte a github.com (un per a l'equip n'hi ha prou).
2. Botó **New repository** → nom `recordam` → **Public** → **Create repository**.
3. A la pàgina del repositori: **uploading an existing file** → arrossegueu-hi *el contingut* de la carpeta `recordam` (index.html, investigadors.html, manifest.webmanifest, sw.js, i les carpetes css, js i icones) → **Commit changes**.
4. **Settings** → **Pages** → a *Branch*, trieu `main` i `/ (root)` → **Save**.
5. Al cap d'uns minuts, l'adreça serà `https://EL-VOSTRE-USUARI.github.io/recordam/`.
6. La pàgina d'investigadors serà `https://EL-VOSTRE-USUARI.github.io/recordam/investigadors.html`.

Per actualitzar-lo, torneu a pujar els fitxers canviats (pas 3). Amb connexió, l'aplicació sempre descarrega la versió més nova; si canvieu l'estructura de fitxers (n'afegiu o en canvieu el nom), pugeu també el número `VERSIO` de `sw.js` i afegiu el fitxer nou a la llista `FITXERS`.

## Instal·lar-lo com a aplicació (PWA)

Cal obrir-lo des de l'adreça https (GitHub Pages). La primera vegada necessita connexió; després s'obre també sense.

- **Android (Chrome):** menú ⋮ → **Instal·la l'aplicació** (o **Afegeix a la pantalla d'inici**).
- **iPhone i iPad (Safari):** botó de compartir → **Afegeix a la pantalla d'inici**. Ha de ser Safari.
- **Ordinador (Chrome o Edge):** icona d'instal·lar a la barra d'adreces, o menú → **Instal·la Recorda'm**.

**Atenció amb les dades:** l'aplicació instal·lada i el navegador poden guardar les dades per separat, sobretot a l'iPhone i l'iPad. Si una persona prova l'aplicació instal·lada, reinicieu el dispositiu des d'ella mateixa i no des de Safari: la pàgina d'investigadors s'ha d'obrir al mateix lloc on es farà la prova. El més senzill és fer cada sessió de proves o bé al navegador o bé a l'aplicació instal·lada, però no barrejar-ho.

## Abans de cada participant (a cada dispositiu)

Les dades es guarden **en cada dispositiu i en cada navegador per separat**.

1. Obriu `investigadors.html` al **mateix navegador** que farà servir el participant.
2. Premeu **Carregar l'estat inicial de proves** (o **Deixar-ho buit**) i confirmeu.
3. Anoteu les dades del dispositiu (apartat 1 de la pàgina) a la fitxa d'observació.
4. Premeu **Obrir Recorda'm**.

No utilitzeu la navegació privada: en tancar-la s'esborren les dades.

## Mostrar un avís de prova

A `investigadors.html`, apartat 3: trieu un recordatori, trieu «Ara mateix», «D'aquí a 10 segons» o «D'aquí a 30 segons» i premeu **Programar l'avís i obrir Recorda'm**. L'avís apareix dins de l'aplicació quan arriba el moment.

## Canviar textos

Tots els textos són a `js/textos.js`. Canvieu només el text entre cometes i mantingueu les paraules entre claus, com `{nom}`.

## Limitacions

- Els avisos només apareixen amb l'aplicació oberta i visible. No són notificacions del mòbil, tot i que ara estigui instal·lada.
- Les dades no se sincronitzen entre dispositius.
- Safari pot esborrar les dades d'una web que no s'ha obert en 7 dies d'ús del navegador. Això no s'aplica a una aplicació afegida a la pantalla d'inici, però convé no dependre'n: no deseu res important.
- L'ús sense connexió no s'ha comprovat en dispositius físics (vegeu la documentació del projecte).
- No s'ha comprovat amb lectors de pantalla reals ni en dispositius físics (vegeu la documentació del projecte).
