import { defineConfig } from 'vite';
import motionCanvasModule from '@motion-canvas/vite-plugin';

const motionCanvas =
  (motionCanvasModule as any).default?.default ??
  (motionCanvasModule as any).default ??
  motionCanvasModule;

export default defineConfig({
  plugins: [motionCanvas()],
  server: {
    fs: {
      allow: [
        'G:/AnimationLab/StyleBenchmark/styles/motion-canvas',
        'G:/AnimationLab/StyleBenchmark/shared',
        'G:/AnimationLab/sandboxes/motion-canvas-demo/node_modules',
      ],
    },
  },
});
