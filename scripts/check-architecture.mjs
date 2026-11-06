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
  lens: ['page', 'secrets', 'project', 'achievements', 'singularity', 'viewer', 'doom'],
  singularity: ['secrets'],
  project: ['achievements', 'page'],
  viewer: ['achievements'],
  doom: ['achievements'],
};

/**
 * Des moteurs en TypeScript pur, rangés en modules : ni Angular, ni paquet npm, ni rien d'autre de
 * l'application. Chaque module ne dépend que de ceux listés ; un fichier posé à la racine du moteur
 * (la façade) peut tout utiliser, et le reste de l'application ne passe que par cette façade.
 * Les tests (.spec.ts) du moteur peuvent lire tous ses modules.
 */
const PURE_MODULES = {
  'features/doom/engine': {
    facade: 'features/doom/engine/engine',
    modules: {
      level: [],
      color: [],
      graphics: ['color', 'level'],
      render: ['color', 'graphics', 'level'],
      play: ['level'],
      automap: ['level', 'render'],
    },
  },
};

const files = walk(ROOT).filter((f) => f.endsWith('.ts'));
const violations = [];

for (const file of files) {
  const from = toModule(relative(ROOT, file));
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:from\s+|import\()\s*'([^']+)'/g)) {
    const spec = match[1];
    const target = resolveSpecifier(spec, file);
    const pure = pureViolation(from, target);
    if (pure) violations.push(`${from}  →  ${spec}  (${pure})`);
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

/** Ce qu'un import enfreint dans les règles des moteurs en TypeScript pur, ou null. */
function pureViolation(from, target) {
  for (const [root, rule] of Object.entries(PURE_MODULES)) {
    const inside = (path) => path.startsWith(`${root}/`);
    // Le premier dossier sous la racine du moteur, ou null pour un fichier posé à la racine (la façade).
    const moduleOf = (path) => {
      const parts = path.slice(root.length + 1).split('/');
      return parts.length > 1 ? parts[0] : null;
    };
    if (inside(from)) {
      if (target === null) return 'le moteur est en TypeScript pur : aucun paquet';
      if (!inside(target)) return 'le moteur ne dépend de rien hors de son dossier';
      if (from.endsWith('.spec.ts')) return null;
      const a = moduleOf(from);
      const b = moduleOf(target);
      if (a === null) return null;
      if (!(a in rule.modules)) return `module « ${a} » à déclarer dans PURE_MODULES`;
      if (b === null) return 'un module ne remonte pas vers la façade';
      if (a !== b && !rule.modules[a].includes(b)) return `« ${a} » ne dépend pas de « ${b} »`;
    } else if (target !== null && inside(target) && target !== rule.facade) {
      return `passer par la façade ${rule.facade}.ts`;
    }
  }
  return null;
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
