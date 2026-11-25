import React from 'react';
import { Composition } from 'remotion';
import { GokuKinetic } from './GokuKinetic';
import { GokuMangaPanels } from './GokuMangaPanels';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GokuKinetic"
        component={GokuKinetic}
        durationInFrames={150}
        fps={30}
        width={720}
        height={1280}
      />
      <Composition
        id="GokuMangaPanels"
        component={GokuMangaPanels}
        durationInFrames={150}
        fps={30}
        width={720}
        height={1280}
      />
    </>
  );
};
