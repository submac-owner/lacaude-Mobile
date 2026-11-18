import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { CDS_ICONS, type CdsIconName } from './icons.generated';

export type { CdsIconName };

/**
 * Renders one of the shipped cds_* icons. Geometry is taken verbatim from the
 * artifact; color defaults to the icon's shipped fill, overridable per use.
 */
export function CdsIcon({
  name,
  size = 22,
  color,
}: {
  name: CdsIconName;
  size?: number;
  color?: string;
}) {
  const def = CDS_ICONS[name];
  if (!def) return null;
  return (
    <Svg width={size} height={size} viewBox={def.viewBox}>
      {def.paths.map((p, i) => (
        <Path key={i} d={p.d} fill={color ?? p.fill} />
      ))}
    </Svg>
  );
}
