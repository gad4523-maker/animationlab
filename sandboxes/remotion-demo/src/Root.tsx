import React from 'react';
import { Composition } from 'remotion';
import { AnimeTitleDemo } from './AnimeTitleDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AnimeTitleDemo"
      component={AnimeTitleDemo}
      durationInFrames={90}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
