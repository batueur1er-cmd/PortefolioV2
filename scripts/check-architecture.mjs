// Vérifie le sens des dépendances entre les couches de src/app.
//
//   core      → core                                (infrastructure : fenêtres, temps, thème, DOM)
//   domain    → core, domain                        (le profil et ses calculs, sans Angular UI)
//   shared    → core, shared                        (briques d'interface et de mouvement)
//   features  → core, domain, shared, elle-même,    (une fonctionnalité par dossier)
//               et les fonctionnalités autorisées dans FEATURE_DEPS
//   shell     → tout                                (assemble les fonctionnalités)
//
// Usage : node scripts/check-architecture.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const ROOT = resolve('src/app');
const ALIASES = { '@core/': 'core/', '@domain/': 'domain/', '@shared/': 'shared/', '@features/': 'features/' };
/** Une fonctionnalité ne dépend que de celles listées ici : jamais de cycle. */
const FEATURE_DEPS = {
  secrets: [],
  page: ['secrets', 'cv'],
  cv: ['achievements'],
  achievements: [],
  terminal: ['achievements', 'secrets', 'cv'],
  lens: ['page', 'secrets', 'project', 'achievements', 'singularity'],
  singularity: [],
  project: [],
};

const files = walk(ROOT).filter((f) => f.endsWith('.ts'));
const violations = [];

for (const file of files) {
  const from = toModule(relative(ROOT, file));
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\()\s*'([^']+)'/g)) {
    const spec = match[1];
    const target = resolveSpecifier(spec, file);
    if (target === null) continue;
    if (!allowed(layerOf(from), layerOf(target))) {
      violations.push(`${from}  →  ${spec}`);
    }
  }
}

if (violations.length) {
  console.error(`Architecture : ${violations.length} dépendance(s) interdite(s)\n`);
  for (const v of violations) console.error(`  ✗ ${v}`);
  process.exit(1);
}
console.log(`Architecture : ${files.length} fichiers, aucune dépendance interdite.`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function toModule(path) {
  return path.split('\\').join('/');
}

/** Chemin (relatif à src/app) visé par un import, ou null pour un paquet npm. */
function resolveSpecifier(spec, file) {
  for (const [alias, dir] of Object.entries(ALIASES)) {
    if (spec.startsWith(alias)) return dir + spec.slice(alias.length);
  }
  if (!spec.startsWith('.')) return null;
  return toModule(relative(ROOT, resolve(dirname(file), spec)));
}

function layerOf(path) {
  const [top, second] = path.split('/');
  if (top === 'features') return { kind: 'feature', name: second };
  if (['core', 'domain', 'shared', 'shell'].includes(top)) return { kind: top };
  return { kind: 'app' };
}

function allowed(from, to) {
  switch (from.kind) {
    case 'core':
      return to.kind === 'core';
    case 'domain':
      return to.kind === 'core' || to.kind === 'domain';
    case 'shared':
      return to.kind === 'core' || to.kind === 'shared';
    case 'feature':
      if (['core', 'domain', 'shared'].includes(to.kind)) return true;
      return to.kind === 'feature' && (to.name === from.name || (FEATURE_DEPS[from.name] ?? []).includes(to.name));
    default:
      return true;
  }
}
