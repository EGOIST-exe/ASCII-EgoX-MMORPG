# EGOX — Der letzte Eid

Ein **Singleplayer-Abenteuer mit einem männlichen Ritter**, dessen Königreich Aurelion gefallen ist. Er sucht Prinzessin Elara, findet verborgene Siegel, befreit einen Drachen und folgt einer Mondglasflöte jenseits des Nebels.

[Spielen](https://egoist-exe.github.io/ASCII-EgoX-MMORPG/) · [Discord](https://discord.gg/ego-x)

## Räumliches ASCII

Die Welt und Figuren bestehen aus **dreidimensional platzierten ASCII-Zeichen**. Ihre Oberflächen werden als Zeichenpunkte mit Tiefenprüfung, Perspektive, Normalenbeleuchtung und zeitabhängigem Glyphenwechsel gezeichnet. Sichtbare gefüllte Polygonflächen gibt es nicht. Die beiden bereitgestellten Videos dienen als visuelle Referenz für nahe, schräge Kamera, räumliche Baumkronen, Gras, Architektur und Reflexionen; ihre Originalassets sind nicht Teil dieses Projekts.

Der Ritter besitzt einen detaillierten Helm mit Visier, Rüstung, bewegliche Gelenke und ein mit geschlossener Hand geführtes Schwert, ohne Schild. Die Animationen unterscheiden Gehen, Sprinten, Schwertkombinationen mit Ausholen, Schlag und Rückführung, Ausweichrollen, Schwertwacht, Sturmtritt, Trinken, Angeln, Rasten, Abbau, Tod, Wiedererwachen und Drachenreiten. Es gibt keine Klassen-, Geschlechts- oder Farbauswahl mehr.

## Einstieg und Autoplay

Das bereitgestellte EGOIST-Intro startet direkt als ASCII-Animation. Musik wird ebenfalls sofort versucht; ein Mundschluss-Geräusch ist an den Videofortschritt gekoppelt. Es gibt keinen Startbutton und keinen Header. Danach erzählt ein 42-sekündiger ASCII-Film in sechs eigenen Sets und Kamerafahrten von Aurelions Fall, Elara und dem letzten Eid. Anschließend sitzt der Ritter unter einer Linde in einer Wiese; nur sein Name wird eingegeben. Enter überspringt den jeweils laufenden Intro-Abschnitt.

Browser können Ton vor der ersten Eingabe sperren. In diesem Fall läuft die Animation weiter, und die Musik wird bei der ersten regulären Eingabe erneut gestartet. Die App umgeht keine Browserrichtlinien. Hintergrundmusik: die bereitgestellten Dateien **Für Elise**, **Cozy Autumn Days** und **Vivaldi – Winter**, mit Überblendungen und separaten synthetischen Aktions-/Naturgeräuschen.

## Die Reise

1. Prolog: Aurelion fällt; der Ritter erneuert seinen Eid.
2. Merin am Brunnen von Lindenruh erzählt von Elaras Flucht.
3. Drei Aschenwächter bewachen die Siegel an den Ruinen. Besiegen, Siegel aufnehmen; die Belohnungen reichen für Rang 4.
4. Drei Siegel und Rang 4 öffnen die Aschengewölbe. Dort folgen zwei Wachen und der Aschenhüter.
5. Nach dem Bosskampf am Nordtor den Drachen befreien. Ascheflügel kann anschließend geritten werden.
6. Im Silberfluss angeln. Nach der Drachenbefreiung liegt die Flöte spätestens im dritten erfolgreichen Fang. Vorher ist sie nicht erhältlich.
7. Der Flötenfund startet die Flugsequenz zur Insel Morgenstern. Dort führt der Weg zu Elara und zur letzten Cinematic.
8. Nach dem Wiedersehen kann die Welt weiter erkundet werden. Die Flöte erlaubt weitere Flüge zwischen den Gebieten.

Das Reisetagebuch nennt Ziele und Koordinaten. Cinematics laufen automatisch und können mit Enter übersprungen werden; ihre spielrelevanten Ergebnisse werden dabei trotzdem angewendet.

## Welt und Ruhepunkte

- 768 × 768 Felder mit offeneren Wiesen, Blumen, lichten Baumgruppen, terrassierten Höhen, Fluss, Ruinen und drei Dörfern. Weltabschnitte werden anhand des tatsächlichen Kameraausschnitts inklusive Seitenrändern nachgeladen, mit drei Detailstufen für große Sichtweiten und ultrabreite Fenster. Umlaufende Bergketten begrenzen die Welt.
- Dichte, hohe Wiesen, zusammenhängende Blumenfelder in fünf Farbgruppen, geschwungene Pfade mit Spurrillen und Steinrändern, Wegweiser, Zäune, Fässer und Holzkarren. Die Brücke hat einzelne Bohlen, Geländer, Streben, Pfeiler und Leuchten.
- Gras und Büsche reagieren auf Kontakt. Baumkronen im Blickweg werden ausgedünnt, damit der Ritter sichtbar bleibt.
- Ein Tag dauert zwölf Minuten. Tagsüber ist es heller, mit Wolkenmustern im Wasser. Nachts erscheinen Mondlicht, Glühwürmchen, leuchtende Dorflichter und Erzpunkte. Mehrere überlagerte Wellen, Strömung, Uferschaum und flackernde Lichtreflexe bewegen das Wasser. Figuren, Bäume und Brücke spiegeln sich wellenverzerrt im Fluss.
- Bänke erlauben eine kurze Rast oder Warten bis zur Nacht, mit eigener Szene und vollständiger Erholung. Rasten setzen den Wiedererwachenspunkt.
- Nach 25 Sekunden sicherer Inaktivität setzt sich der Ritter automatisch an ein kleines Lagerfeuer. Eingaben wecken ihn; das Feuer glimmt zwölf Sekunden aus. In Feindnähe, beim Angeln und im Dungeon entsteht kein Lager.
- Begehbare, möblierte ASCII-Hausinnenräume; die Außenwelt wird vollständig ausgeblendet.
- Kämpfe, Erfahrung, vier Ritterkünste, Händler-Upgrades, Tränke, Fische, Beute, Holz-/Steinabbau und seltene Materialien. Kein Crafting-System.
- Bei Tod Wiedererwachen am Rastpunkt gegen fünf Prozent Gold; Geschichte und Ausrüstung bleiben erhalten.
- Kleine Textanzeigen statt großer HUD-Panels. Keine Minikarte. Menüs pausieren die Simulation.

## Steuerung

| Taste                      | Aktion                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| WASD / Pfeile              | Gehen                                                                                        |
| Shift                      | Sprinten                                                                                     |
| Strg / Ctrl                | Ausweichrolle in Bewegungs- oder Blickrichtung; 25 Atem, kurze Unverwundbarkeit, Abklingzeit |
| Leertaste / Welt anklicken | Schwertkombination                                                                           |
| 1                          | Weiter Schwerthieb                                                                           |
| 2                          | Schwertwacht                                                                                 |
| 3                          | Sturmtritt, ab Rang 3                                                                        |
| 4                          | Letzter Eid, ab Rang 5                                                                       |
| E                          | Gespräch, Kiste, Siegel, Tür, Rastbank; am Fluss auswerfen und bei „Biss“ einholen           |
| G / G halten               | Holz oder Stein abbauen                                                                      |
| Q                          | Heiltrank                                                                                    |
| V                          | Drachenreiten ein/aus, nach Freischaltung                                                    |
| F                          | Mondglasflöte, nach Freischaltung                                                            |
| I / J / M                  | Gepäck / Reisetagebuch / große ASCII-Karte                                                   |
| Tab halten                 | Ritterkünste anzeigen                                                                        |
| R                          | Nach dem Tod wieder erwachen                                                                 |
| Enter                      | Cinematic abschließen / Gespräch fortsetzen                                                  |
| Esc                        | Einstellungen / Menü schließen                                                               |

## Spielstände und Technik

Fortschritt wird lokal automatisch und über das Menü gespeichert, einschließlich Geschichte, Materialien, Dungeon und laufender Cinematic. Spielstände der vorherigen Alpha werden beim Fortsetzen in einen Ritter umgewandelt; die Geschichte beginnt neu, Name, Rang und Gold werden übernommen. Die alten Speicherschlüssel bleiben erhalten.

**Ausschließlich Singleplayer.** Kein PeerJS, keine Gruppen, Accounts, Cloud-Spielstände oder dauerhaft laufender MMO-Server. Das Repository behält seinen bisherigen Namen und die GitHub-Pages-Adresse.

Zum Spielen werden eine Tastatur und ein WebGL-fähiger Browser benötigt. Die Charaktererstellung und Menüs sind responsive. Auf kleineren Geräten wird die Darstellung angepasst; eine Touch-Bewegungssteuerung ist nicht enthalten.

## Entwicklung

Node.js 22 oder neuer:

```sh
npm ci
npm run dev
npm test
npm run build
```

`dist/` enthält die statische Website mit relativen Assetpfaden. Push auf `main` führt über `.github/workflows/pages.yml` Tests, Build und Veröffentlichung auf GitHub Pages aus.

- `src/core.js`: Singleplayer-Simulation, Ritter, Kämpfe, Kapitel, Siegel, Dungeon, Angeln, Drache, Rasten, Tageszeit und Speicherung.
- `src/glyph-models.js`: Dreidimensionale Zeichenflächen, Rittergelenke, Landschaftsstrukturen, Innenräume und Drache.
- `src/landscape.js`: Gemeinsame Kurvenpfade, Brückendeck, Blumenfelder und Bergrelief für Darstellung und Kollision.
- `src/view-distance.js`: Kameraabhängige Weltabdeckung und Detailstufen.
- `src/cinematography.js` / `src/environment-models.js`: Filmablauf, Kamerafahrten, Sets, Brücke und Lagerfeuer.
- `src/ascii-batch.js`: Zusammengefasste starre Zeichenflächen, Gelenke bleiben separat beweglich.
- `src/render.js`: Projektion der ASCII-Punkte, Shader, Licht, Reflexionen, Wiesen, Partikel und räumliche Cinematics.
- `src/main.js` / `src/style.css`: Automatisches Intro, Namenseingabe, Spieloberfläche, Gespräche und Menüs.
- `src/audio.js`: Musik, Autoplay-Versuch mit Eingabe-Fallback, Überblendungen und Geräusche.
- `tests/`: Vollständiger Kampagnenablauf, Fortschrittssperren, Kampf, Angeln, Rasten, Innenräume, Speicherung sowie Punktgeometrie und Gelenkanimationen.
