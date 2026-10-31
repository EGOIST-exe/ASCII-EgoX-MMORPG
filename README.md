# EGOX — ASCII Realms · 3D / Living ASCII

Ein spielbares 3D-Fantasy-RPG für GitHub Pages. Echte räumliche Modelle werden durch einen farbigen GPU-ASCII-Shader dargestellt. Die Zeichen cyclen permanent durch gleich dichte Glyphen; die Geometrie bleibt dabei lesbar.

## Spielen

[Spiel öffnen](https://egoist-exe.github.io/ASCII-EgoX-MMORPG/) · [Discord](https://discord.gg/ego-x)

„Mit Ton beginnen“ aktiviert Intro, Musik und den Sound beim Schließen des Mundes. Das Original-Intro wird aus `public/assets/intro.mp4` live in ASCII-Zeichen umgewandelt. Die separate Charakterauswahl zeigt ein animiertes 3D-Modell ohne Welt im Hintergrund. Mit Pfeiltasten, Buttons oder seitlichem Wischen die Klasse wechseln; Ziehen dreht das Modell. Gestalt, Farbvariante und Name auswählen. Fortschritt wird alle zehn Sekunden lokal gespeichert; Spielstände der ersten Alpha werden übernommen.

## Enthalten

- Vier Klassen mit je sechs Künsten: **Elf** als Heiler mit Gruppenheilung, mehrsekündiger Wurzelfessel und Schwächung; **Samurai** als schneller Nahkämpfer; **Magier** mit wenig Leben und weitreichenden Zaubern; **Paladin** mit Schild, viel Leben und hoher Verteidigung bei geringerer Geschwindigkeit.
- Prozedural modellierte 3D-Körper, Gesichter, Ohren, Haare, Kleidung, Rüstung, Waffen und Schilde. Gelenkbasierte Geh-, Schlag-, Zauber- und Abbauanimationen. Männliche/weibliche Gestalt und sechs Farbauswahlen.
- Welt mit **768 × 768 Feldern**, also 16-mal so viel Fläche wie zuvor. Fünf Landschaftstypen und sechs Siedlungen; Simulation und Darstellung laden Abschnitte um die Spieler nach.
- Dichte 3D-Wiesen, verschiedenfarbige Blumen, Büsche, Bäume, räumliche Steinbögen und Ruinen. Gras und Büsche biegen sich bei Spielerkontakt zur Seite; Baumkronen im Sichtweg werden per Dithering transparent.
- 3D-Fachwerkhäuser mit Fenstern, Türen, Dächern und Schornsteinen. Mit **E** an der Tür betreten: Die Außenwelt wird vollständig durch einen eigenen möblierten 3D-Innenraum ersetzt. Bett, Tisch, Stühle, Geschirr, Bücherregale, Teppich, Fenster und Kamin. Am Ausgang mit E zurückkehren. Gäste können dieselben Räume betreten.
- Nahe, schräg von vorne oben folgende Kamera. Farbiger ASCII-Shader mit zeitgesteuertem Glyphenwechsel, regelbarer Zeichendichte, Licht, Schatten und Nebel. Wasser mit wellenverzerrter planarer 3D-Reflexion.
- Regen, Schnee und Gewitter, Glühwürmchen, bewegte Vegetation und eigenständige Web-Audio-Effekte für Angriffe, Zauber, Heilung, Schild, Holz- und Steinabbau.
- Deine drei bereitgestellten Musikdateien: **Für Elise** für Intro/Charakterauswahl, **Cozy Autumn Days** in den gemäßigten Regionen und **Vivaldi – Winter** im Frostgebiet. In den Einstellungen frei auswählbar; sanfte Überblendung. Die Originaldateien bleiben unverändert, Webkopien liegen in `public/assets/`.
- Sechs eigene Gegnerdarstellungen: Slimes, Skelette mit Knochenbau, Zombies, Banditen, Orks mit Hauern und Echsenmenschen mit Schwanz. Verfolgung, Kämpfe, Erfahrung, Levelaufstieg und Wiederbelebung.
- Bäume fällen und Felsen abbauen mit **G**. Holz und Stein sowie selten **antikes Holz** und **seltene Erze**: 2,5 % der jeweiligen Vorkommen. Ressourcen verschwinden, werden synchronisiert und erneuern sich nach vier Minuten Spielzeit. Materialien bleiben im Inventar gespeichert; ein Crafting-System ist noch nicht enthalten.
- Gold, Kisten, Klassenwaffen, Werkzeuge, Bücher, Rüstung, Schreine, Händler und Quest. Vier aktive Fähigkeiten mit Ressourcenverbrauch und Abklingzeit.
- Reduziertes HUD am Rand, **keine Minikarte**. Die große Weltkarte ist nur über M geöffnet. Einstellungen für Lautstärke, Musikauswahl, Animationen, Glyphenwechsel, Zeichendichte, Kamera und Tasten. Zum Spielen wird eine Tastatur und WebGL2 benötigt.

## Steuerung

| Taste                          | Aktion                                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| WASD / Pfeiltasten             | Bewegen                                                           |
| Shift                          | Sprinten, verbraucht Ausdauer                                     |
| Leertaste / Klick auf die Welt | Nächsten Feind im Waffenradius angreifen                          |
| 1–4                            | Klassenfähigkeiten                                                |
| E                              | NPCs, Kisten, Schreine, Haustüren und Innenraumausgänge verwenden |
| G / G halten                   | Bäume fällen oder Stein abbauen; Axt/Spitzhacke automatisch       |
| Q                              | Heiltrank                                                         |
| I / M / J / P                  | Inventar / Weltkarte / Journal / Gruppe                           |
| Esc                            | Einstellungen bzw. Menü schließen                                 |

Elara steht nordwestlich vom Brunnen. Eldric steht nordöstlich. Mira wartet südlich. Eine erste Kiste liegt südöstlich, der erste Schrein südwestlich. Außerhalb der Siedlungen ist die Welt gefährlich.

## Zusammen spielen

„Gruppe“ → „Gruppe erstellen“ → Einladungslink kopieren. Freunde öffnen den Link und erstellen einen Charakter. Maximal **vier Spieler insgesamt**. Der Host simuliert Welt, Gegner, Inventare, Kämpfe und Beute; Gäste senden Bewegungsbefehle und Aktionen und erhalten regelmäßig Weltzustände. Kisten und Schreine werden gemeinsam verbraucht.

Die Verbindung verwendet [PeerJS](https://peerjs.com/client/getting-started) und WebRTC mit dem öffentlichen PeerJS-Vermittlungsdienst. Der Host muss das Spiel geöffnet halten. Er simuliert auch Heilung, Wurzelfesseln, Rohstoffabbau und Hausübergänge. Die Übertragung begrenzt Gegner und Beute auf den Bereich um den Gast. Firewalls/NAT können Direktverbindungen verhindern; ein eigener TURN-Dienst ist nicht enthalten. Für Solo sind keine Spielserver nötig. Schriftarten werden über Google Fonts geladen und haben lokale Fallbacks.

Dies ist eine **spielbare RPG-/Koop-Alpha**, kein persistentes Massively-Multiplayer-System. Es gibt keine zentralen Accounts, Cloud-Spielstände, serverseitige Betrugssicherung oder dauerhaft laufende gemeinsame Welt. Gastcharaktere gelten für die aktuelle Sitzung; der separate Solo-Spielstand bleibt erhalten. Auf dem Host wird dessen eigener Fortschritt und die geöffnete Beute gespeichert, nicht die Gastcharaktere.

## Lokal entwickeln

Node.js 22 oder neuer:

```sh
npm ci
npm run dev
npm test
npm run build
```

`dist/` ist eine vollständig statische, mit relativen Asset-Pfaden gebaute Website. `.github/workflows/pages.yml` testet, baut und veröffentlicht bei Push auf `main`. In GitHub unter **Settings → Pages → Source: GitHub Actions** wählen, falls noch nicht eingerichtet.

## Projektstruktur

- `src/core.js`: Welt, Klassen, Werte, Gegner, Kampf, Händler, Inventar und Quests; unabhängig vom Browser testbar.
- `src/render.js`: Three.js, nachgeladene Instanzen, Kameras, GPU-ASCII-Shader, Kontaktvegetation, Raumwechsel, Schatten, Wetter und Wasserreflexion.
- `src/models.js`: Räumliche Charaktere, Gegner, Gelenkanimationen, Häuser, Ruinen und Möbel.
- `src/network.js`: Vierergruppen, Host-Autorität und WebRTC-Verbindungen.
- `src/audio.js`: Musikdateien, Überblendungen und synthetisierte Aktions-/Umgebungsgeräusche.
- `src/main.js` / `src/style.css`: Intro, Charakterauswahl, Spieloberfläche, Menüs und lokale Speicherung.
- `tests/core.test.js`: Determinismus, Rollen, Kollisionen, Heilreichweite, Wurzelfessel, Beute, Handel, Rohstoffe, seltene Funde, Hausübergänge und Innenraumisolation.

Die beiden Inspirationsvideos wurden nur als visuelle Referenz verwendet. Das bereitgestellte EGOIST-Intro wurde für Browser konvertiert; Originaldateien bleiben unverändert.
