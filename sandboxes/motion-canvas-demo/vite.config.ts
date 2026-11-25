import { defineConfig } from 'vite';
import motionCanvasModule from '@motion-canvas/vite-plugin';

const motionCanvas =
  (motionCanvasModule as any).default?.default ??
  (motionCanvasModule as any).default ??
  motionCanvasModule;

export default defineConfig({
  plugins: [motionCanvas()],
});
