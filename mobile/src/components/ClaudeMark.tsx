import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { CLAUDE_MARK } from './brand.generated';

/**
 * The Claude sunburst mark, from logo_claude_splash.xml (fill #d97757).
 * Trademark of Anthropic PBC — used here only as a local placeholder.
 *
 * The source drawable wraps the path in an Android <group scaleX scaleY
 * translateX translateY>. react-native-svg applies the equivalent as an SVG
 * transform matrix, so we emit `translate(...) scale(...)` (scale then shift),
 * matching Android's group semantics.
 */
export function ClaudeMark({
  size = 28,
  color = '#d97757',
  opacity = 1,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  const { viewBox, group, path } = CLAUDE_MARK;
  const transform = `translate(${group.translateX}, ${group.translateY}) scale(${group.scaleX}, ${group.scaleY})`;
  return (
    <Svg width={size} height={size} viewBox={viewBox} opacity={opacity}>
      <G transform={transform}>
        <Path d={path} fill={color} />
      </G>
    </Svg>
  );
}