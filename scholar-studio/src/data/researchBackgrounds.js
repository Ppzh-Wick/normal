export const researchBackgrounds = {
  threads: {
    name: '铜金脉络', component: 'Threads', url: 'https://reactbits.dev/backgrounds/threads',
    props: {
      color: '#bd8b6b', accentColor: '#e7d3af', amplitude: 1.3, distance: 0.38,
      lineCount: 48, thickness: 0.8, softness: 1.1, speed: 0.22, waves: 0.7,
      split: 0.12, fray: 0.18, angle: 18, taper: 0.65, brightness: 1.15,
      opacity: 0.58, enableMouseInteraction: false,
    },
  },
  aurora: {
    name: '酒红曙光', component: 'Aurora', url: 'https://reactbits.dev/backgrounds/aurora',
    props: {
      colorStops: ['#572530', '#b98d63', '#77343d'], amplitude: 0.85, blend: 0.7,
      speed: 0.25, height: 0.58, scale: 1.1, glow: 0.28, brightness: 0.8,
      layers: 1, direction: 'top', mouseInteraction: false, intro: false, opacity: 0.6, dpr: 1,
    },
  },
  darkveil: {
    name: '烟铜幕光', component: 'Dark Veil', url: 'https://reactbits.dev/backgrounds/dark-veil',
    props: {
      color: '#a77d64', speed: 0.35, scale: 1.15, rotation: -12, flow: 0.7,
      warp: 0.2, variation: 0.12, brightness: 0.75, sheen: 0.15, glow: 0.12,
      grain: 0.018, quality: 0.5, mouseInteraction: false, intro: false, opacity: 0.65, dpr: 1,
    },
  },
};

export function getResearchBackground(search) {
  const choice = new URLSearchParams(search).get('ambient');
  return Object.hasOwn(researchBackgrounds, choice) ? choice : 'threads';
}
