
    import { solveChoreography } from '../choreography.js';
    import { drawGoku2DMaster } from '../goku_2d_master.js';
    window.render2DPanel = (t, overrideSSJ, zoomBoost) => {
      let c = document.getElementById('c');
      if (!c) {
        c = document.createElement('canvas');
        c.id = 'c';
        c.width = 720;
        c.height = 640;
        document.body.appendChild(c);
      }
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 720, 640);
      const ch = solveChoreography(t);
      if (overrideSSJ !== null) ch.ssj = overrideSSJ;
      ctx.save();
      if (zoomBoost) {
        ch.camDist *= 0.45;
        ch.camY += 0.36;
        ctx.translate(0, -290);
        drawGoku2DMaster(ctx, ch, 720, 1280);
      } else {
        // Render full 720x1280 portrait scaled cleanly into 720x640 (centered) so full boots->hair silhouette is visible!
        ctx.fillStyle = '#091020';
        ctx.fillRect(0, 0, 720, 640);
        ctx.translate(180, 0);
        ctx.scale(0.5, 0.5);
        drawGoku2DMaster(ctx, ch, 720, 1280);
      }
      ctx.restore();
      return c.toDataURL('image/png');
    };
  