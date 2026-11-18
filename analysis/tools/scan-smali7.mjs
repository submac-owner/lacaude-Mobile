// Pass 7: find Compose typography definitions. Scans files that reference
// androidx.compose TextStyle for float (const/high16) and double (const-wide)
// size constants in a plausible sp range.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));

const results = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = fs.readFileSync(f, 'utf8');
      if (!t.includes('TextStyle;') && !t.includes('TextStyleKt')) return;
      const sizes = new Set();
      for (const m of t.matchAll(/const\/high16\s+v\d+,\s*(0x[0-9a-fA-F]{8})/g)) {
        const b = Buffer.alloc(4); b.writeUInt32BE(parseInt(m[1], 16) >>> 0);
        const n = b.readFloatBE(0);
        if (Number.isFinite(n) && n >= 7 && n <= 48 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-6) sizes.add(n);
      }
      for (const m of t.matchAll(/const-wide(?:\/\d+)?\s+v\d+,\s*(0x[0-9a-fA-F]{16})L?/g)) {
        const b = Buffer.alloc(8);
        b.writeBigUInt64BE(BigInt(m[1]));
        const n = b.readDoubleBE(0);
        if (Number.isFinite(n) && n >= 7 && n <= 48 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-6) sizes.add(n);
      }
      if (sizes.size >= 4) results.push([path.relative(root, f).split(path.sep).join('/'), [...sizes].sort((a, b) => a - b), t.length]);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

results.sort((a, b) => b[1].length - a[1].length);
console.log('== TextStyle-referencing classes with the most size constants ==');
for (const [rel, s, len] of results.slice(0, 18)) console.log(`${String(s.length).padStart(3)}  ${rel}\n      ${s.join(', ')}`);
console.log('\ntotal candidates:', results.length);
