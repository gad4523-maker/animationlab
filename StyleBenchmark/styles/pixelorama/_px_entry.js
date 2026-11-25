
import { solveChoreography } from '../../shared/choreography.js';
import { drawGoku2DMaster } from '../../shared/goku_2d_master.js';
window.renderPxKey = (t) => {
  let c = document.getElementById('c');
  if (!c) { c = document.createElement('canvas'); c.id = 'c'; c.width = 720; c.height = 1280; document.body.appendChild(c); }
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 720, 1280);
  drawGoku2DMaster(ctx, solveChoreography(t), 720, 1280);
  const sm = document.getElementById('sm') || (() => { const s = document.createElement('canvas'); s.id = 'sm'; s.width = 108; s.height = 192; return s; })();
  const sctx = sm.getContext('2d');
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(c, 0, 0, 108, 192);
  return sm.toDataURL('image/png');
};
