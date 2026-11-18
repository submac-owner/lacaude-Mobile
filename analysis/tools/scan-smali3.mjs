// Pass 3: join resource tables with smali references to rank the design tokens
// the app actually uses, and resolve the base app theme.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'analysis/apktool';
const resDir = path.join(root, 'res');
const read = (p) => fs.readFileSync(p, 'utf8');

// --- 1. public.xml: name -> {id,type}
const pub = read(path.join(resDir, 'values', 'public.xml'));
const nameTo = new Map();
const idType = new Map();
for (const m of pub.matchAll(/<public type="([a-z]+)" name="([^"]+)" id="(0x[0-9a-f]+)"/g)) {
  nameTo.set(m[2], { id: m[3], type: m[1] });
  idType.set(m[3], m[1]);
}

// --- 2. value tables (light/dark/night-qualified)
function parseValues(file) {
  const out = new Map();
  if (!fs.existsSync(file)) return out;
  const t = read(file);
  for (const m of t.matchAll(/<(color|dimen)\s+name="([^"]+)"\s*>([^<]+)<\/\1>/g)) {
    out.set(m[2], m[3]);
  }
  return out;
}
const colorVals = new Map([...parseValues(path.join(resDir, 'values', 'colors.xml'))]);
const colorValsNight = parseValues(path.join(resDir, 'values-night', 'colors.xml'));
const dimenVals = parseValues(path.join(resDir, 'values', 'dimens.xml'));

const idToColor = (id, night = false) => {
  const nm = [...nameTo.entries()].find(([, v]) => v.id === id && v.type === 'color');
  if (!nm) return undefined;
  const tbl = night ? colorValsNight : colorVals;
  return tbl.get(nm[0]);
};

// --- 3. scan smali for resource-id constants
const smaliRoots = fs.readdirSync(root).filter((d) => d.startsWith('smali'));
const colorRef = new Map();
const dimenRef = new Map();
const stringRef = new Map();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.smali')) {
      const t = fs.readFileSync(f, 'utf8');
      for (const m of t.matchAll(/0x(7f06[0-9a-f]{4})/g)) colorRef.set('0x' + m[1], (colorRef.get('0x' + m[1]) || 0) + 1);
      for (const m of t.matchAll(/0x(7f07[0-9a-f]{4})/g)) dimenRef.set('0x' + m[1], (dimenRef.get('0x' + m[1]) || 0) + 1);
      for (const m of t.matchAll(/0x(7f14[0-9a-f]{4})/g)) stringRef.set('0x' + m[1], (stringRef.get('0x' + m[1]) || 0) + 1);
    }
  }
}
for (const r of smaliRoots) walk(path.join(root, r));

const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

console.log('== TOP COLOR RESOURCES BY CODE REFERENCES (light / dark) ==');
for (const [id, n] of top(colorRef, 40)) {
  console.log(String(n).padStart(5), id, (idToColor(id) || '?').padEnd(10), (idToColor(id, true) || '-'));
}
console.log('\n== TOP DIMEN RESOURCES BY CODE REFERENCES ==');
for (const [id, n] of top(dimenRef, 30)) {
  const nm = [...nameTo.entries()].find(([, v]) => v.id === id && v.type === 'dimen');
  console.log(String(n).padStart(5), id, nm ? (dimenVals.get(nm[0]) || '?') : '?');
}
console.log('\n== TOP STRING RESOURCES BY CODE REFERENCES ==');
const strs = read(path.join(resDir, 'values', 'strings.xml'));
const strMap = new Map();
for (const m of strs.matchAll(/<string name="([^"]+)"[^>]*>([\s\S]*?)<\/string>/g)) strMap.set(m[1], m[2].replace(/\s+/g, ' ').slice(0, 70));
for (const [id, n] of top(stringRef, 30)) {
  const nm = [...nameTo.entries()].find(([, v]) => v.id === id && v.type === 'string');
  console.log(String(n).padStart(5), id, JSON.stringify(nm ? (strMap.get(nm[0]) ?? '') : '?'));
}

// --- 4. base app theme style
const styles = read(path.join(resDir, 'values', 'styles.xml'));
for (const want of ['0x7f150277', '0x7f150276', '0x7f150274', '0x7f150275']) {
  const nm = `APKTOOL_RENAMED_${want}`;
  const re = new RegExp(`<style name="${nm}"([^>]*)>([\\s\\S]*?)</style>`);
  const m = styles.match(re);
  console.log(`\n== style ${want} ==`);
  if (!m) { console.log('(not found in values/styles.xml)'); continue; }
  console.log('<style' + m[1] + '>');
  for (const it of m[2].matchAll(/<item name="([^"]+)">([^<]+)<\/item>/g)) console.log('   ', it[1], '=', it[2]);
}
