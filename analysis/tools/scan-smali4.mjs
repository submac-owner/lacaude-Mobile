// Pass 4: locate palette/theme classes by counting distinct color-like
// constants per file (alpha byte in 0x80..0xff), excluding float patterns.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));

const KNOWN = ['fff9f9f7', 'ffd97757', 'ff0b0b0b', 'ff7b7974', 'ffe7e6e1', 'fff0efec', 'faf9f5', '141413', '0d0d0d', 'ba5b3c', '97958d', '1a1a19'];
const hits = new Map();
const scored = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = fs.readFileSync(f, 'utf8');
      const rel = path.relative(root, f).split(path.sep).join('/');
      const set = new Set();
      for (const m of t.matchAll(/0x([0-9a-fA-F]{8})L?\b/g)) {
        const h = m[1].toLowerCase();
        const a = parseInt(h.slice(0, 2), 16);
        if (a >= 0x80) set.add(h);
      }
      for (const m of t.matchAll(/0x([0-9a-fA-F]{16})L?\b/g)) {
        const h = m[1].toLowerCase().slice(0, 8);
        if (parseInt(h.slice(0, 2), 16) >= 0x80) set.add(h);
      }
      if (set.size >= 4) scored.push([rel, [...set]]);
      for (const k of KNOWN) if (t.includes(k)) hits.set(k, (hits.get(k) || 0) + 1);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

scored.sort((a, b) => b[1].length - a[1].length);
console.log('== files with the most color-like constants ==');
for (const [rel, list] of scored.slice(0, 15)) {
  console.log(`\n  ${rel}  (${list.length})`);
  console.log('     ' + list.slice(0, 40).join(' '));
}
console.log('\n== known-token literal hits (file counts) ==');
for (const [k, v] of [...hits.entries()].sort((a, b) => b[1] - a[1])) console.log('  ', k, v);
console.log('\nfiles with >=4 constants:', scored.length);
