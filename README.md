# Recorda'm — Prototip V1 (PWA)

Prototip web interactiu per a l'avaluació de la usabilitat amb persones de 65 anys o més.
Projecte de final de cicle (CFGS Imatge per al Diagnòstic i Medicina Nuclear).

No és una aplicació sanitària: no diagnostica, no recomana tractaments i no es connecta a cap servei.
Utilitzeu només dades fictícies.

## Què hi ha a la carpeta

| Fitxer | Què fa |
| --- | --- |
| `index.html` | L'aplicació (Inici, Medicació, Cites mèdiques, Exercicis, Agenda, Properes tasques) |
| `investigadors.html` | Pàgina per als investigadors: reiniciar dades i mostrar avisos de prova. No té cap enllaç des de l'aplicació |
| `css/estils.css` | Colors, mides i adaptació a pantalles |
| `js/textos.js` | Tots els textos en català i castellà |
| `js/dades.js` | Guardar i llegir les dades (localStorage) i estat inicial de proves |
| `js/recordatoris.js` | Càlcul de quan toca cada cosa i quan s'avisa (moments del dia, freqüències, cites i agenda) |
| `js/app.js` | Pantalles, formularis, navegació i avisos |
| `manifest.webmanifest` | Nom, colors i icones de l'aplicació instal·lada (PWA) |
| `sw.js` | Service worker: desa una còpia dels fitxers perquè s'obri també sense connexió |
| `js/pwa.js` | Registra el service worker (només des d'una adreça https) |
| `js/tema.js` | Aplica el mode clar/fosc abans de pintar la pàgina (perquè no hi hagi un parpelleig) |
| `icones/` | Logo de Recorda'm (`logo.svg`: campana amb tic, blau i blanc) i icones de l'aplicació (192 i 512 px, versió *maskable*, icona d'Apple i favicon) |

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

## Mode clar i mode fosc

A **Ajustos** hi ha l'apartat **Aspecte de la pantalla** amb dues opcions: **Mode clar** (per defecte) i **Mode fosc**. El canvi es veu a l'instant, no mou la pantalla i es recorda a cada dispositiu. Tots els parells de colors del mode fosc compleixen un contrast mínim de 4,5:1 (comprovat per a tots els textos de les pantalles i finestres). Els colors són variables de `css/estils.css` (`:root` per al clar i `html[data-tema="fosc"]` per al fosc), i l'ajust es desa a `ajustos.tema` (`'clar'` o `'fosc'`). La pàgina d'investigadors no canvia de tema.

## Les quatre seccions (versió 9)

Les seccions no tenen text d'ajuda ni encapçalaments «de farciment»: s'entra i es veu directament el que toca.

**Medicació i Exercicis** (van per **moments del dia**)
- La pantalla mostra sempre els tres moments d'avui: **Matí**, **Migdia** (als exercicis, **Tarda**) i **Nit**. Si en un moment no toca res, hi surt «No toca prendre res» (o «No toca fer cap exercici»).
- Cada medicament o exercici té dos botons: **Fet** (verd suau, marca la presa o l'exercici i es pot desfer amb **Desfer**) i **Treure** (gris; treu aquella vegada de la llista, amb confirmació, sense esborrar res). Els botons són més discrets que el nom i la dosi, que són el que es veu primer.
- **Franja vermella** «Ha passat l'hora!» quan el moment ja ha passat i no s'ha marcat com a fet: matí a partir de les 13:00, migdia/tarda a partir de les 17:00 i nit a partir de les 23:00. Pampalluga suaument (no pampalluga si el dispositiu demana reduir el moviment).
- Sota hi ha dos botons: **Afegir medicament / exercici** i **Els meus medicaments / exercicis** (la llista sencera, amb Canviar i Esborrar).
- Si encara no hi ha res, es veu només un missatge al centre i el botó d'afegir.

**Cites mèdiques i Agenda**
- **Cites:** «La propera cita és:» amb una targeta compacta (hora, motiu, dia i què cal portar) i els botons **Fet** i **Treure**. **Fet** demana confirmació i, en confirmar-ho, la cita **desapareix de tot arreu** (s'esborra; també de la pantalla d'inici i de «Les meves cites»). **Treure** només la treu de «La propera cita» sense esborrar-la. A la pantalla d'inici, les cites només tenen el botó **Fet**. **Agenda:** «El proper esdeveniment és:» amb una targeta gran: el dia, l'hora, el nom i les notes. Sota, els botons **Afegir** i **Les meves cites / La meva agenda** (la llista sencera, amb les passades a part).
- Si encara no hi ha res, es veu només un missatge al centre i el botó d'afegir.

## Formularis

- **Medicació i Exercicis:** nom (i dosi o durada), **quan** (Matí, Migdia/Tarda, Nit: es pot triar un, dos o els tres) i **quins dies**: *Cada dia*, *Cada setmana*, *Cada mes* o *Només alguns dies* (a Medicació també *Cada 2 setmanes* i *Cada 3 setmanes*: es compta des del primer dia triat a partir d'avui). Per a «Cada setmana» i «Cada mes» només cal confirmar una dada, que ja ve triada amb el dia d'avui (el dia de la setmana, o el número del dia del mes; si el mes és més curt, es compta l'últim dia). No hi ha data d'inici ni de final.
- **Cites:** motiu, data, hora i «Què haig de portar?» (opcional). Ja no hi ha camp de lloc. **Agenda:** què, data, hora, notes i si es repeteix (un cop, cada dia, cada setmana, cada mes o alguns dies; el dia de la setmana o del mes surt de la data triada).
- **Barra fixa a baix** a tots els formularis (afegir i canviar): **Desar** (blau) a l'esquerra i **Cancel·lar** (vermell) a la dreta, a tots els formularis. Sempre es veuen, encara que la pantalla s'hagi de desplaçar.
- Quan una medicació o un exercici es canvia de moments o de freqüència, es compta des d'aquell moment (no apareixen moments d'avui que ja han passat).

## Avisos (automàtics)

Ja no hi ha botó ni casella d'avís: cada cosa avisa automàticament, sempre amb l'aplicació oberta.

| Què | Quan avisa |
| --- | --- |
| Medicació i exercicis | A l'hora del seu moment: matí 9:00, migdia/tarda 14:00, nit 21:00 |
| Cites | 1 dia abans, a la mateixa hora |
| Agenda | 1 hora abans |

Els avisos de medicació i exercicis tenen el botó **Fet**; els de cites i agenda, només **D'acord**. Les hores d'avís i de «ha passat l'hora» són a `MOMENTS` (`js/recordatoris.js`).

## Properes tasques (pantalla d'inici)

- **Capçalera de l'inici:** salutació segons l'hora (**Bon dia** de 6:00 a 13:59, **Bona tarda** de 14:00 a 20:59, **Bona nit** de 21:00 a 5:59), la data a l'esquerra i l'hora actual a la dreta, a la mateixa línia (al mòbil s'abrevia la data i s'amaga el text «Hora actual:» perquè hi càpiguen). L'hora i la salutació s'actualitzen soles.
- **«Properes tasques»** mostra només **cites mèdiques i entrades de l'agenda d'avui i de demà**. El botó **Veure la setmana** obre la llista de 7 dies (des d'allà es pot tornar a avui i demà). La medicació i els exercicis no hi surten: tenen la seva pantalla.
- Les tasques són targetes **compactes**: l'hora a l'esquerra, el títol, la categoria i el dia (Avui o Demà). La distribució s'adapta a l'amplada: al mòbil els botons van a sota; a tauleta o ordinador, a la dreta.
- **Fet** demana confirmació («Ja ho has fet?») i es pot desfer amb **Desfer**. Les tasques fetes es queden a la llista, en verd.
- **Avís vermell** «Ha passat l'hora!»: només surt quan ja ha arribat l'hora i la tasca no està feta. Els lectors de pantalla ho anuncien.
- **Treure** (✕) demana confirmació, **no esborra res** i treu només aquella vegada de la llista; no surt cap missatge a dalt (només s'anuncia als lectors de pantalla). Es desa a `descartats` i s'esborra sol al cap de dos dies.

## Dades guardades (versió 2)

Les dades es guarden a `localStorage` (clau `recordam.v1`) amb `versio: 2`. Les dades de la versió anterior (medicació amb hores i dates, activitats amb data i hora, avisos configurables) **es converteixen soles** la primera vegada que s'obre aquesta versió: les hores passen al moment del dia més proper (abans de les 12:00 matí, de 12:00 a 17:59 migdia, de 18:00 en endavant nit), es treuen les dates de final i els avisos configurables, i les preses ja marcades es conserven. Un exercici d'una sola vegada (que ja no es pot crear) es converteix en una freqüència de «Només alguns dies» amb el dia de la setmana d'aquella data.

## Canviar textos

Tots els textos són a `js/textos.js`. Canvieu només el text entre cometes i mantingueu les paraules entre claus, com `{nom}`.

## Limitacions

- Els avisos només apareixen amb l'aplicació oberta i visible. No són notificacions del mòbil, tot i que ara estigui instal·lada.
- Les dades no se sincronitzen entre dispositius.
- Safari pot esborrar les dades d'una web que no s'ha obert en 7 dies d'ús del navegador. Això no s'aplica a una aplicació afegida a la pantalla d'inici, però convé no dependre'n: no deseu res important.
- L'ús sense connexió no s'ha comprovat en dispositius físics (vegeu la documentació del projecte).
- No s'ha comprovat amb lectors de pantalla reals ni en dispositius físics (vegeu la documentació del projecte).
