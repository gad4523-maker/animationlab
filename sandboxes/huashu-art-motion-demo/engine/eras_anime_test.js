const R = 1866;
window.BPM = 128;
window.ERAS = [
  {
    id: '25_ghibli',
    name: '吉卜力夏日',
    dur: 1.4,
    counter: {
      year: 1988,
      roll: 0,
      x: R,
      y: 132,
      size: 96,
      font: 'CormorantGaramond-700',
      color: '#2e4a2b',
      label: { text: 'GHIBLI WATERCOLOR · 1988', font: '30px "Poppins-700"', color: '#4a6b38', y: 184 },
    },
  },
  {
    id: '35_shinkai',
    name: '新海诚光影',
    dur: 1.4,
    transition: { type: 'godRays', dur: 0.35, cx: 712, cy: 196 },
    counter: {
      year: 2016,
      roll: 0.3,
      x: R,
      y: 132,
      size: 96,
      font: 'Poppins-800',
      color: '#1b3b6f',
      label: { text: 'SHINKAI LIGHT & CLOUDS · 2016', font: '28px "Poppins-600"', color: '#2b589c', y: 184 },
    },
  },
  {
    id: '14_8bit',
    name: '8-BIT PIXEL',
    dur: 1.2,
    transition: { type: 'pixelate', dur: 0.25 },
    counter: {
      year: 1985,
      roll: 0.2,
      x: R,
      y: 86,
      size: 60,
      font: 'PressStart2P-400',
      color: '#ffffff',
      shadow: { color: '#0b1d24', x: 4, y: 4 },
      label: { text: '8-BIT PIXEL ART', font: '28px "PressStart2P-400"', color: '#ffffff', y: 138, shadow: { color: '#0b1d24', x: 3, y: 3 } },
    },
  },
];
