// Pass 6: relaxed scan for typography-ish classes (many plausible sp/float
// constants) and for Compose TextStyle/Sp construction sites.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));

const byFile = new Map();
const spSites = new Map();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = fs.readFileSync(f, 'utf8');
      if (!t.includes('const/high16')) return;
      const rel = path.relative(root, f).split(path.sep).join('/');
      const floats = new Set();
      for (const m of t.matchAll(/const\/high16\s+v\d+,\s*(0x[0-9a-fA-F]{8})/g)) {
        const b = Buffer.alloc(4); b.writeUInt32BE(parseInt(m[1], 16) >>> 0);
        const n = b.readFloatBE(0);
        if (Number.isFinite(n) && n >= 7 && n <= 48 && Math.abs(n * 4 - Math.round(n * 4)) < 1e-6) floats.add(n);
      }
      if (floats.size >= 5) byFile.set(rel, [...floats].sort((a, b) => a - b));
      const sp = [...t.matchAll(/TextUnitKt;->(?:getSp|Sp)\(F\)J|Sp\(F\)J|TextUnitKt->Sp\(F\)/g)].length;
      if (sp) spSites.set(rel, sp);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

const topFiles = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 15);
console.log('== classes with many plausible font-size floats ==');
for (const [rel, fl] of topFiles) console.log(`${String(fl.length).padStart(3)}  ${rel}\n      ${fl.join(', ')}`);

const topSp = [...spSites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\n== heaviest Compose .sp construction sites ==');
for (const [rel, n] of topSp) console.log(String(n).padStart(4), rel);
