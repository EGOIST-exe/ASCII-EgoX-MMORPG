# EGOX — ASCII Realms

Ein spielbares Fantasy-RPG für GitHub Pages. Eine handgestaltete Oberfläche trifft auf eine deterministisch erzeugte, lebendige ASCII-Welt.

## Spielen

[Spiel öffnen](https://egoist-exe.github.io/ASCII-EgoX-MMORPG/) · [Discord](https://discord.gg/ego-x)

Das Original-Intro wird aus `public/assets/intro.mp4` live in ASCII-Zeichen umgewandelt. Danach Klasse, männliche/weibliche Gestalt und Name wählen. Fortschritt wird automatisch alle zehn Sekunden im Browser gespeichert. Über „Gespeichertes Abenteuer fortsetzen“ weiterspielen.

## Enthalten

- Magier, Samurai, Elf und Paladin mit unterschiedlichen Werten, Waffen und je sechs Fähigkeiten. Zwei Startfähigkeiten, zufällige neue Klassenfähigkeiten bei Levelaufstieg. Vier aktive Plätze, im Inventar umsortierbar.
- Welt mit 192 × 192 Feldern: Immergrüner Wald, Frostkamm, Orklande, Ruinen und Flüstersümpfe. Drei Siedlungen mit sicheren Bereichen, Häusern, Händlern und Heilern.
- ASCII-Baumkronen, die Spieler darunter sichtbar lassen, animierte Büsche/Blätter, Glühwürmchen, Wasser mit stilisierten Spiegelungen und zwei Brücken.
- Zufälliger Regen, Schnee und Gewitter. Synthetischer Fantasy-Soundtrack, Klassenvarianten, Umgebungsgeräusche und Effekte über Web Audio; keine fremden Musiktitel.
- Sechs Gegnerarten: Slimes, Skelette, Zombies, Banditen, Orks und Echsenmenschen. Verfolgung, Angriffe, Beute, Erfahrung, Respawn und Tod mit Rückkehr zum Dorf.
- Gold, Kisten mit Klassenwaffen/Werkzeugen/Büchern, Schreine, Heiltränke, Pfeile, Waffen und Rüstung zum Ausrüsten. Händlerpreise und Schaden zentral in `src/core.js`.
- Quest mit überprüften Zielen und einmaliger Belohnung, Inventar, Weltkarte, Minikarte, HUD für Leben/Mana/Ausdauer, Gold/Buffs, Fähigkeiten und Munition.
- Einstellbare Tasten, Lautstärke, Musik, Animationen und Kameranähe. Reduzierte Bewegung wird berücksichtigt. Responsive Oberfläche; zum Spielen wird eine Tastatur benötigt.

## Steuerung

| Taste | Aktion |
| --- | --- |
| WASD / Pfeiltasten | Bewegen |
| Shift | Sprinten, verbraucht Ausdauer |
| Leertaste / Klick auf die Welt | Nächsten Feind im Waffenradius angreifen |
| 1–4 | Klassenfähigkeiten |
| E | Nahe NPCs, Kisten oder Schreine verwenden |
| Q | Heiltrank |
| I / M / J / P | Inventar / Weltkarte / Journal / Gruppe |
| Esc | Einstellungen bzw. Menü schließen |

Elara steht nordwestlich vom Brunnen. Eldric steht nordöstlich. Mira wartet südlich. Eine erste Kiste liegt südöstlich, der erste Schrein südwestlich. Außerhalb der Siedlungen ist die Welt gefährlich.

## Zusammen spielen

„Gruppe“ → „Gruppe erstellen“ → Einladungslink kopieren. Freunde öffnen den Link und erstellen einen Charakter. Maximal **vier Spieler insgesamt**. Der Host simuliert Welt, Gegner, Inventare, Kämpfe und Beute; Gäste senden Bewegungsbefehle und Aktionen und erhalten regelmäßig Weltzustände. Kisten und Schreine werden gemeinsam verbraucht.

Die Verbindung verwendet [PeerJS](https://peerjs.com/client/getting-started) und WebRTC mit dem öffentlichen PeerJS-Vermittlungsdienst. Der Host muss das Spiel geöffnet halten. Firewalls/NAT können Direktverbindungen verhindern; ein eigener TURN-Dienst ist nicht enthalten. Für Solo sind keine Spielserver nötig. Schriftarten werden über Google Fonts geladen und haben lokale Fallbacks.

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
- `src/render.js`: Canvas-ASCII-Rendering, Transparenz, Wetter, Wasser und Karten.
- `src/network.js`: Vierergruppen, Host-Autorität und WebRTC-Verbindungen.
- `src/audio.js`: Prozedural erzeugte Musik und Geräusche.
- `src/main.js` / `src/style.css`: Intro, Charakterauswahl, Spieloberfläche, Menüs und lokale Speicherung.
- `tests/core.test.js`: Determinismus, Klassen, Kollisionen, Fähigkeiten, Belohnungen, Wiederbelebung und Handelsregeln.

Die beiden Inspirationsvideos wurden nur als visuelle Referenz verwendet. Das bereitgestellte EGOIST-Intro wurde für Browser konvertiert; Originaldateien bleiben unverändert.
