import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { CLAUDE_MARK } from './brand.generated';

/**
 * The Claude sunburst mark, taken from logo_claude_splash.xml (fill #d97757).
 * Trademark of Anthropic PBC — used here only as a local placeholder.
 */
export function ClaudeMark({ size = 28, color = '#d97757', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  const { viewBox, group, path } = CLAUDE_MARK;
  return (
    <Svg width={size} height={size} viewBox={viewBox} opacity={opacity}>
      <G
        scaleX={group.scaleX}
        scaleY={group.scaleY}
        translateX={group.translateX}
        translateY={group.translateY}
      >
        <Path d={path} fill={color} />
      </G>
    </Svg>
  );
}
