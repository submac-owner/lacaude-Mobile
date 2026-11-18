// Pass 5: resolve o30/v <clinit> to (field -> packed Compose color -> ARGB),
// in declaration order, and locate typography-like classes.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';

function read(p) { return fs.readFileSync(p, 'utf8'); }

// ---- parse one smali class's static color fields -------------------------
function classColors(file) {
  const t = read(file);
  const cls = t.match(/^\.class[^\n]*\s(L[^\n]+);/m);
  const fields = [...t.matchAll(/^\.field[^\n]*\s([A-Za-z0-9_$]+):J\s*$/gm)].map((m) => m[1]);
  const clinitIdx = t.indexOf('.method static constructor <clinit>()V');
  const body = clinitIdx >= 0 ? t.slice(clinitIdx) : '';
  const vals = new Map();
  let pending = null;
  for (const line of body.split('\n')) {
    const c = line.match(/const-wide(?:\/\d+)?\s+v\d+,\s*(0x[0-9a-fA-F]+)L?\s*$/);
    if (c) { pending = c[1]; continue; }
    const s = line.match(/sput-wide\s+v\d+,\s*L[^;]+;->([A-Za-z0-9_$]+):J/);
    if (s && pending) { vals.set(s[1], pending); pending = null; }
    if (line.startsWith('.end method')) break;
  }
  return { cls: cls ? cls[1] : file, fields, vals };
}

const argbOf = (hex) => {
  const v = BigInt(hex);
  if (hex.replace(/^0x/, '').length <= 8) return Number(v & 0xffffffffn) >>> 0;
  const hi = Number((v >> 32n) & 0xffffffffn) >>> 0;
  return (hi >>> 24) >= 0x80 ? hi : Number(v & 0xffffffffn) >>> 0;
};
const hex = (n) => '#' + n.toString(16).padStart(8, '0');

// ---- palette class -------------------------------------------------------
for (const f of ['smali/o30/v.smali']) {
  const p = path.join(root, ...f.split('/'));
  if (!fs.existsSync(p)) { console.log('missing', f); continue; }
  const { fields, vals } = classColors(p);
  const rows = fields.filter((k) => vals.has(k)).map((k, i) => [i, k, hex(argbOf(vals.get(k)))]);
  console.log(`== ${f}: ${fields.length} long fields, ${vals.size} initialized ==`);
  console.log(rows.map(([i, k, h]) => `${k}=${h}`).join('  '));
  const uniq = [...new Set(rows.map((r) => r[2]))].sort();
  console.log(`\ndistinct ARGB values (${uniq.length}):\n` + uniq.join(' '));
}

// ---- find typography / spacing classes ----------------------------------
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));
const cand = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = read(f);
      if (!/TextStyle|TextUnit|FontWeight/.test(t)) return;
      const floats = new Set();
      for (const m of t.matchAll(/const\/high16\s+v\d+,\s*(0x[0-9a-fA-F]+)/g)) {
        const fv = Buffer.alloc(4); fv.writeUInt32BE(parseInt(m[1], 16) >>> 0);
        const n = fv.readFloatBE(0);
        if (Number.isFinite(n) && n > 6 && n < 60 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-6) floats.add(n);
      }
      if (floats.size >= 6) cand.push([path.relative(root, f).split(path.sep).join('/'), [...floats].sort((a, b) => a - b)]);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));
cand.sort((a, b) => b[1].length - a[1].length);
console.log('\n== candidate typography/spacing classes (most sp-like float constants) ==');
for (const [rel, fl] of cand.slice(0, 12)) console.log(`${String(fl.length).padStart(3)}  ${rel}\n      ${fl.join(', ')}`);
