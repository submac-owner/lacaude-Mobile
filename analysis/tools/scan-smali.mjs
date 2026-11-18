// Scans apktool-decoded smali for (a) package layout under com/anthropic and
// (b) 32-bit color constants, by frequency. Read-only.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));

const pkgCounts = new Map();
const colorCounts = new Map();
const colorByScope = new Map(); // scope -> Map(color -> count)
let files = 0;

function scopeOf(p) {
  if (/\/theme\//i.test(p)) return 'theme';
  if (/\/ui\//i.test(p)) return 'ui';
  if (/cds/i.test(p)) return 'cds';
  if (/compose/i.test(p)) return 'compose';
  return 'other';
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.smali')) {
      files++;
      const rel = path.relative(root, full).split(path.sep).join('/');
      const m = rel.match(/^smali[^/]*\/(com\/anthropic(?:\/[^/]+){0,4})\//);
      if (m) pkgCounts.set(m[1], (pkgCounts.get(m[1]) || 0) + 1);
      const txt = fs.readFileSync(full, 'utf8');
      const sc = scopeOf(rel);
      for (const mm of txt.matchAll(/0x([0-9a-fA-F]{8})\b/g)) {
        const hex = mm[1].toLowerCase();
        if (parseInt(hex.slice(0, 2), 16) < 0x80) continue; // skip mostly-transparent
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        let s = colorByScope.get(sc);
        if (!s) { s = new Map(); colorByScope.set(sc, s); }
        s.set(hex, (s.get(hex) || 0) + 1);
      }
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

console.log('== files scanned:', files);
console.log('\n== top com/anthropic package dirs (by smali file count) ==');
for (const [k, v] of top(pkgCounts, 45)) console.log(String(v).padStart(6), k);

console.log('\n== top 45 color constants (all scopes) ==');
for (const [k, v] of top(colorCounts, 45)) console.log(String(v).padStart(6), '#' + k.slice(2));

for (const scope of ['theme', 'ui', 'cds', 'compose']) {
  const m = colorByScope.get(scope);
  if (!m) continue;
  console.log(`\n== top 30 color constants in scope "${scope}" ==`);
  for (const [k, v] of top(m, 30)) console.log(String(v).padStart(6), '#' + k.slice(2));
}
