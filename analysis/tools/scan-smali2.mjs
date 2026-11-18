// Pass 2: correct Compose color extraction (handles 0xRRGGBB, 0xAARRGGBB,
// 0x...L long literals and 16-digit packed values), plus package discovery.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));

const all = new Map();
const themeScoped = new Map();
const dirsFirst = new Map();
const interestingDirs = new Map();
let files = 0;

function argbOf(hex) {
  const v = BigInt('0x' + hex);
  if (hex.length <= 8) return Number(v & 0xffffffffn) >>> 0;
  const hi = Number((v >> 32n) & 0xffffffffn) >>> 0; // Compose packs argb in high 32
  const lo = Number(v & 0xffffffffn) >>> 0;
  if ((hi >>> 24) >= 0x80) return hi;
  if ((lo >>> 24) >= 0x80) return lo;
  return 0;
}
function toHex(argb) { return '#' + argb.toString(16).padStart(8, '0'); }

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.smali')) {
      files++;
      const rel = path.relative(root, full).split(path.sep).join('/');
      const m = rel.match(/^smali[^/]*\/com\/anthropic\/claude\/([^/]+)\//);
      if (m) dirsFirst.set(m[1], (dirsFirst.get(m[1]) || 0) + 1);
      if (/theme|cds|design|token/i.test(rel)) {
        const seg = rel.replace(/^smali[^/]*\//, '');
        interestingDirs.set(seg, 1);
      }
      const txt = fs.readFileSync(full, 'utf8');
      for (const mm of txt.matchAll(/0x([0-9a-fA-F]{6,16})L?/g)) {
        const argb = argbOf(mm[1]);
        if (!argb) continue;
        const h = toHex(argb);
        all.set(h, (all.get(h) || 0) + 1);
        if (/theme|cds/i.test(rel)) themeScoped.set(h, (themeScoped.get(h) || 0) + 1);
      }
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
console.log('files:', files);
console.log('\n== com/anthropic/claude/* (depth 1, by file count) ==');
for (const [k, v] of top(dirsFirst, 40)) console.log(String(v).padStart(6), k);
console.log('\n== paths matching theme|cds|design|token (sample) ==');
const ints = [...interestingDirs.keys()];
console.log('total matching files:', ints.length);
for (const p of ints.slice(0, 40)) console.log('  ', p);
console.log('\n== top 60 colors (all scopes) ==');
for (const [k, v] of top(all, 60)) console.log(String(v).padStart(6), k);
console.log('\n== top 40 colors in theme|cds paths ==');
for (const [k, v] of top(themeScoped, 40)) console.log(String(v).padStart(6), k);
