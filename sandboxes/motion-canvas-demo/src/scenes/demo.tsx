import { Circle, Line, Rect, Txt, makeScene2D } from '@motion-canvas/2d';
import { all, createRef, easeInOutCubic, easeOutBack, easeOutExpo, waitFor } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const outerRing = createRef<Circle>();
  const innerRing = createRef<Circle>();
  const coreDiamond = createRef<Rect>();
  const slashLine = createRef<Line>();
  const title = createRef<Txt>();
  const sub = createRef<Txt>();

  view.add(
    <>
      <Circle
        ref={outerRing}
        size={420}
        stroke={'#00f5ff'}
        lineWidth={5}
        lineDash={[28, 16]}
        opacity={0}
        scale={0.4}
      />
      <Circle
        ref={innerRing}
        size={310}
        stroke={'#ffbe0b'}
        lineWidth={3}
        lineDash={[14, 10]}
        opacity={0}
        scale={1.4}
      />
      <Rect
        ref={coreDiamond}
        size={150}
        rotation={45}
        stroke={'#ffffff'}
        fill={'rgba(0, 245, 255, 0.14)'}
        lineWidth={4}
        scale={0}
      />
      <Line
        ref={slashLine}
        points={[[-560, 240], [560, -240]]}
        stroke={'#00f5ff'}
        lineWidth={8}
        end={0}
      />
      <Txt
        ref={title}
        text={'MOTION CANVAS // HUD'}
        fontFamily={'Segoe UI, Arial, sans-serif'}
        fontSize={62}
        fontWeight={800}
        fill={'#ffffff'}
        y={-18}
        opacity={0}
        scale={0.85}
      />
      <Txt
        ref={sub}
        text={'GENERATOR TIMELINE · 1280×720 · 30 FPS'}
        fontFamily={'Segoe UI, Arial, sans-serif'}
        fontSize={24}
        fontWeight={600}
        fill={'#7dd3fc'}
        y={46}
        opacity={0}
      />
    </>
  );

  yield* all(
    outerRing().opacity(0.9, 0.4),
    outerRing().scale(1, 0.8, easeOutExpo),
    outerRing().rotation(90, 1.5, easeInOutCubic),
    innerRing().opacity(0.8, 0.5),
    innerRing().scale(1, 0.8, easeOutBack),
    innerRing().rotation(-120, 1.5, easeInOutCubic),
    coreDiamond().scale(1, 0.7, easeOutBack),
  );

  yield* all(
    slashLine().end(1, 0.45, easeOutExpo),
    title().opacity(1, 0.45),
    title().scale(1, 0.5, easeOutBack),
    sub().opacity(1, 0.55),
    outerRing().rotation(210, 1.0, easeInOutCubic),
    innerRing().rotation(-260, 1.0, easeInOutCubic),
  );

  yield* all(
    slashLine().opacity(0.25, 0.5),
    outerRing().rotation(270, 0.5),
    waitFor(0.5),
  );
});
