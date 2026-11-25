import { canvas, W, H } from '/styles/cel-anime-80s/demo/cel.js';
import { makePost } from '/styles/cel-anime-80s/demo/post.js';
import { streetPlate, skylinePlate, smear, reflectPlate } from '/styles/cel-anime-80s/demo/bg.js';
import { side } from '/styles/cel-anime-80s/demo/shots.js';
import { bustShot, highwayPlate, highway } from '/styles/cel-anime-80s/demo/scenes2.js';

const [sc, g] = canvas(W, H);
const [gc, e] = canvas(W, H);
const [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));

const A = {};
{
  const st = streetPlate(4800, 700, 3, 'night');
  A.street = smear(st, 16, 8);
  A.refl = reflectPlate(A.street, 340, 0.8);
  A.sky = skylinePlate(3840, 560, 9, 'night');
  A.highway = highwayPlate();
}

const DUR = 3.5;

function render(t) {
  for (const x of [g, e]) {
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.filter = 'none';
  }
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  e.fillStyle = '#000';
  e.fillRect(0, 0, W, H);

  if (t < 1.8) {
    side({ t: t + 14.0, lt: t, u: t / 1.8, g, e, A, name: 'side' }, 'night');
  } else if (t < 2.7) {
    const lt = t - 1.8;
    bustShot({ t: t + 18.0, lt, u: lt / 0.9, g, e, A, name: 'bust' });
  } else {
    const lt = t - 2.7;
    highway({ t: t + 22.0, lt, u: lt / 0.8, g, e, A, name: 'highway' });
  }

  ov.clearRect(0, 0, W, H);
  ov.font = '700 42px "Fredoka", sans-serif';
  ov.textAlign = 'center';
  ov.lineWidth = 8;
  ov.strokeStyle = 'rgba(10, 8, 22, 0.9)';
  ov.fillStyle = '#fef08a';
  const caption = t < 1.8 ? 'LEMO-OPUSCAR // 80s CEL ANIME' : 'CRT PHOSPHOR + BACKLIT CEL';
  ov.strokeText(caption, W / 2, H - 96);
  ov.fillText(caption, W / 2, H - 96);

  const fr = Math.round(t * 24);
  post.render(sc, gc, fr, ovc, { power: Math.min(1, t / 0.25), track: 0 });
}

window.DUR = DUR;
window.EV = [
  { type: 'crton', t: 0.02 },
  { type: 'whoosh', t: 1.8 },
  { type: 'rev', t: 2.7 },
];
window.render = render;
render(1.0);
window.READY = true;
