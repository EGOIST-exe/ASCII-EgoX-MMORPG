export const FILM_SHOTS = [
  {
    id: "kingdom",
    duration: 7,
    title: "AURELION / VOR DEM FALL",
    line: "Ein Königreich, das du Heimat nanntest.",
    from: [15, 13, 23],
    to: [8, 8, 16],
    target: [0, 3, -2],
    fov: 46,
  },
  {
    id: "garden",
    duration: 6,
    title: "DER LETZTE FRIEDLICHE MORGEN",
    line: "Elara gab dir ein Band aus Silber. Und einen Grund, zurückzukehren.",
    from: [5, 3.6, 7],
    to: [2.7, 2.7, 5.3],
    target: [0.4, 1.5, 0],
    fov: 38,
  },
  {
    id: "siege",
    duration: 8,
    title: "DANN KAM DER NORDWIND",
    line: "Die Tore brachen. Rauch nahm den Sternen ihr Licht.",
    from: [-12, 5, 16],
    to: [-4, 3.2, 12],
    target: [0, 2, -3],
    fov: 48,
  },
  {
    id: "last-stand",
    duration: 7,
    title: "DEIN LETZTER KAMPF FÜR AURELION",
    line: "Du hieltest den Durchgang. Bis auch dein Schwert schwer wurde.",
    from: [4.8, 3.1, 7],
    to: [-3.8, 2.8, 6],
    target: [0, 1.3, 0.3],
    fov: 36,
  },
  {
    id: "ashes",
    duration: 6,
    title: "WAS VOM KÖNIGREICH BLIEB",
    line: "Nur Asche, dein Schwert und ein Versprechen.",
    from: [1.5, 2, 5],
    to: [7, 6, 12],
    target: [0, 0.9, 0],
    fov: 43,
  },
  {
    id: "oath",
    duration: 8,
    title: "UNTER EINER ALTEN LINDE",
    line: "Du wirst sie finden. Und wenn dein Weg bis hinter den Nebel führt.",
    from: [7, 4.6, 9],
    to: [4.6, 3.1, 6.8],
    target: [0, 1, -0.5],
    fov: 40,
  },
];
export const FILM_DURATION = FILM_SHOTS.reduce((n, s) => n + s.duration, 0);
export function filmShotAt(time) {
  let start = 0;
  for (const shot of FILM_SHOTS) {
    if (time < start + shot.duration || shot === FILM_SHOTS.at(-1)) {
      const local = Math.max(0, Math.min(shot.duration, time - start)),
        t = local / shot.duration,
        ease = t * t * (3 - 2 * t);
      return {
        ...shot,
        local,
        progress: t,
        camera: shot.from.map((n, i) => n + (shot.to[i] - n) * ease),
        fade: Math.max(0, 1 - local / 0.38, 1 - (shot.duration - local) / 0.38),
      };
    }
    start += shot.duration;
  }
}
