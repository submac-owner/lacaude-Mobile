// Find literal substrings across decoded smali (fast, bounded output).
// usage: node find-literals.mjs <root> <literal1> [literal2 ...]
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const needles = process.argv.slice(3);
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));
const hits = new Map(needles.map((n) => [n, []]));

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = fs.readFileSync(f, 'utf8');
      const has = needles.some((n) => t.includes(n));
      if (!has) return;
      const rel = path.relative(root, f).split(path.sep).join('/');
      for (const n of needles) if (t.includes(n)) hits.get(n).push(rel);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));
for (const [n, files] of hits) {
  console.log(`\n== "${n}": ${files.length} file(s)`);
  for (const f of files.slice(0, 12)) console.log('   ', f);
}
