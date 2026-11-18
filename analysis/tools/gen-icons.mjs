// Generates a TypeScript icon module from the decoded cds_icon_* vector
// drawables. Converts each Android <vector> to an SVG path list on a 20x20
// viewport (as shipped). Pure transform of the shipped assets.
import fs from 'node:fs';
import path from 'node:path';

const resDir = process.argv[2] || 'analysis/apktool/res';
const out = process.argv[3] || 'mobile/src/components/icons.generated.ts';

const colorVals = new Map();
for (const f of ['values/colors.xml', 'values-night/colors.xml']) {
  const p = path.join(resDir, f);
  if (!fs.existsSync(p)) continue;
  for (const m of fs.readFileSync(p, 'utf8').matchAll(/<color name="([^"]+)"\s*>([^<]+)</g)) colorVals.set(m[1], m[2]);
}
const resolveColor = (c) => {
  const m = c && c.match(/@color\/(.+)/);
  if (m) return colorVals.get(m[1]) || c;
  return c;
};

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/^cds_icon_.*\.xml$/.test(e.name)) files.push(p);
  }
};
walk(resDir);
files.sort();

const icons = [];
for (const f of files) {
  const xml = fs.readFileSync(f, 'utf8');
  const vpW = (xml.match(/viewportWidth="([\d.]+)"/) || [, '20'])[1];
  const vpH = (xml.match(/viewportHeight="([\d.]+)"/) || [, '20'])[1];
  const paths = [];
  for (const m of xml.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attrs = m[1];
    const d = (attrs.match(/pathData="([^"]*)"/) || [])[1];
    if (!d) continue;
    const fill = resolveColor((attrs.match(/fillColor="([^"]*)"/) || [])[1] || 'currentColor');
    paths.push({ d, fill });
  }
  if (!paths.length) continue;
  icons.push({ name: f.match(/cds_icon_(.*)\.xml/)[1], viewBox: `0 0 ${vpW} ${vpH}`, paths });
}

const lines = [];
lines.push('// AUTO-GENERATED from the analyzed artifact\'s cds_icon_* vector drawables.');
lines.push('// Source: res/drawable*/cds_icon_*.xml. Regenerate with analysis/tools/gen-icons.mjs.');
lines.push('export type CdsIconDef = { viewBox: string; paths: { d: string; fill: string }[] };');
lines.push('');
lines.push('export const CDS_ICONS = {');
for (const ic of icons) {
  lines.push(`  ${JSON.stringify(ic.name)}: { viewBox: ${JSON.stringify(ic.viewBox)}, paths: [`);
  for (const p of ic.paths) lines.push(`    { d: ${JSON.stringify(p.d)}, fill: ${JSON.stringify(p.fill)} },`);
  lines.push('  ] },');
}
lines.push('} as const satisfies Record<string, CdsIconDef>;');
lines.push('');
lines.push('export type CdsIconName = keyof typeof CDS_ICONS;');
lines.push('');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'));
console.log(`icons: ${icons.length} -> ${out}`);
console.log(icons.map((i) => i.name).join(', '));
