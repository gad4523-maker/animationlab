import { Circle, Line, Node, Rect, Txt, makeScene2D } from '@motion-canvas/2d';
import { all, chain, createRef, createSignal, easeInOutCubic, easeOutExpo, linear, waitFor } from '@motion-canvas/core';
// @ts-ignore
import { solveChoreography } from '../../../../shared/choreography.js';
// @ts-ignore
import { drawGoku2DMaster } from '../../../../shared/goku_2d_master.js';

export default makeScene2D(function* (view) {
  view.fill('#090e20');

  const timeSig = createSignal(0);

  class GokuMasterNode extends Node {
    protected override draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.translate(-360, -640);
      drawGoku2DMaster(ctx, solveChoreography(timeSig()), 720, 1280);
      ctx.restore();
    }
  }

  const auraOuter = createRef<Circle>();
  const auraInner = createRef<Circle>();
  const shockRing = createRef<Circle>();
  const title = createRef<Txt>();
  const barTop = createRef<Line>();
  const barBottom = createRef<Line>();

  view.add(
    <>
      <GokuMasterNode />
      <Circle
        ref={auraOuter}
        size={520}
        stroke={'rgba(255, 217, 59, 0.72)'}
        lineWidth={5}
        lineDash={[28, 16]}
        opacity={0}
        scale={0.55}
      />
      <Circle
        ref={auraInner}
        size={360}
        stroke={'rgba(255, 246, 160, 0.65)'}
        lineWidth={3}
        lineDash={[12, 18]}
        opacity={0}
        scale={0.65}
      />
      <Circle
        ref={shockRing}
        size={140}
        stroke={'#fff8b8'}
        lineWidth={12}
        opacity={0}
        scale={0.5}
      />
      <Rect width={660} height={1220} stroke={'rgba(255, 217, 59, 0.25)'} lineWidth={2} />
      <Line ref={barTop} points={[[-300, -560], [300, -560]]} stroke={'#ffd93b'} lineWidth={4} opacity={0.7} />
      <Line ref={barBottom} points={[[-300, 560], [300, 560]]} stroke={'#ffd93b'} lineWidth={4} opacity={0.7} />
      <Txt
        ref={title}
        text={'POWER LEVEL SURGING'}
        fontFamily={'Segoe UI, Arial, sans-serif'}
        fontSize={30}
        fontWeight={800}
        fill={'#ffd93b'}
        y={-520}
        opacity={0.9}
      />
    </>,
  );

  yield* all(
    timeSig(5.0, 5.0, linear),
    chain(
      // Phase 1: 0.0 -> 1.2s
      all(
        auraOuter().opacity(0.42, 1.2, easeInOutCubic),
        auraOuter().scale(0.88, 1.2, easeInOutCubic),
        auraOuter().rotation(90, 1.2, linear),
      ),
      // Phase 2: 1.2 -> 2.8s
      all(
        auraOuter().opacity(0.80, 1.6),
        auraOuter().rotation(270, 1.6, linear),
        auraInner().opacity(0.68, 1.6),
        auraInner().rotation(-180, 1.6, linear),
      ),
      // Phase 3: 2.8 -> 3.45s (explosion at 2.80s)
      all(
        shockRing().opacity(1, 0.06).to(0, 0.59),
        shockRing().scale(5.5, 0.65, easeOutExpo),
        auraOuter().scale(1.32, 0.35),
        auraOuter().opacity(0.92, 0.35),
        title().text('SUPER SAIYAN', 0.1),
        title().fill('#fff494', 0.2),
        barTop().stroke('#fff494', 0.2),
        barBottom().stroke('#fff494', 0.2),
      ),
      // Phase 4: 3.45 -> 5.00s
      all(
        auraOuter().rotation(450, 1.55, linear),
        auraOuter().opacity(0.75, 1.55),
        auraInner().scale(1.18, 0.8).to(1.0, 0.75),
        auraInner().rotation(-360, 1.55, linear),
      ),
    ),
  );
  yield* waitFor(0.01);
});
