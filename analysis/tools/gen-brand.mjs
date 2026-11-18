// Extracts the Claude sunburst mark from logo_claude_splash.xml into a TS module.
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2] || 'analysis/apktool/res/drawable/logo_claude_splash.xml';
const out = process.argv[3] || 'mobile/src/components/brand.generated.ts';
const xml = fs.readFileSync(src, 'utf8');

const vpW = (xml.match(/viewportWidth="([\d.]+)"/) || [, '288'])[1];
const vpH = (xml.match(/viewportHeight="([\d.]+)"/) || [, '288'])[1];
const g = xml.match(/<group\b([^>]*)>/);
const attr = (s, k) => Number((s?.match(new RegExp(`${k}="([-\\d.]+)"`)) || [])[1]);
const group = {
  scaleX: attr(g?.[1], 'scaleX') || 1,
  scaleY: attr(g?.[1], 'scaleY') || 1,
  translateX: attr(g?.[1], 'translateX') || 0,
  translateY: attr(g?.[1], 'translateY') || 0,
};

// First <path> is the sunburst mark; skip the wordmark.
const first = xml.match(/<path[^>]*pathData="([^"]+)"/);
if (!first) throw new Error('no path found');

const lines = [
  "// AUTO-GENERATED from the analyzed artifact's logo_claude_splash.xml.",
  "// The Claude sunburst mark is an Anthropic trademark; used here only as a",
  "// local placeholder for a BYOK client, never as this project's own identity.",
  "export const CLAUDE_MARK = {",
  `  viewBox: ${JSON.stringify(`0 0 ${vpW} ${vpH}`)},`,
  `  group: ${JSON.stringify(group)},`,
  `  path: ${JSON.stringify(first[1])},`,
  "} as const;",
  "",
];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'));
console.log(`wrote ${out} (path ${first[1].length} chars, viewBox ${vpW}x${vpH})`);
