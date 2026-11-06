import { Mesh } from 'three';

import { DEMO_MODELS } from '../data/demo-catalog';
import { buildDemo } from './demo-models';
import { ViewerScene } from './viewer-scene';

const COLORS = { accent: '#4f46e5', accent2: '#9333ea', xl: '#7fe9ff', xn: '#ffd84d', xp: '#ff5bd0' };

/** Sans WebGL (jsdom), la scène se calcule sans rien dessiner : de quoi tester les modèles. */
function sceneWithoutWebGL(): ViewerScene {
  const canvas = document.createElement('canvas');
  // jsdom n'a pas de contexte WebGL : le moteur le constate et continue sans rendu.
  canvas.getContext = (() => null) as typeof canvas.getContext;
  return new ViewerScene(canvas, { interactive: false, reducedMotion: true, colors: COLORS });
}

const TWO_OBJECTS = [
  'o socle',
  'v 0 0 0',
  'v 4 0 0',
  'v 4 0 2',
  'v 0 0 2',
  'f 1 2 3',
  'f 1 3 4',
  'o pointe',
  'v 2 3 1',
  'f 1 2 5',
].join('\n');

describe('scène du visualiseur 3D', () => {
  it('construit chaque modèle d’exemple, avec des pièces nommées', () => {
    for (const demo of DEMO_MODELS) {
      const meshes: Mesh[] = [];
      buildDemo(demo.id).traverse((o) => {
        if ((o as Mesh).isMesh) meshes.push(o as Mesh);
      });
      expect(meshes.length).toBeGreaterThan(1);
      for (const mesh of meshes) expect(mesh.name).not.toBe('');
    }
    expect(() => buildDemo('inconnu')).toThrow();
  });

  it('cache quelque chose dans le colis, que seuls les rayons X montrent', () => {
    const hidden: string[] = [];
    buildDemo('colis').traverse((o) => {
      if (o.userData['role'] === 'hidden') hidden.push(o.name);
    });
    expect(hidden).toEqual(['contenu']);
  });

  it('fonctionne sans WebGL : le modèle est lu et compté, rien n’est dessiné', () => {
    const scene = sceneWithoutWebGL();
    expect(scene.renderer).toBeNull();
    const info = scene.showDemo('demo:boite-de-vitesses', 'boite-de-vitesses');
    expect(info.objects).toBe(13);
    expect(info.triangles).toBeGreaterThan(1000);
    expect(info.parts.map((p) => p.name)).toContain('carter');
    expect(scene.modelKey).toBe('demo:boite-de-vitesses');
    scene.dispose();
  });

  it('lit un fichier OBJ : objets, triangles et dimensions d’origine', () => {
    const scene = sceneWithoutWebGL();
    const info = scene.showObj('file:essai', TWO_OBJECTS);
    expect(info.objects).toBe(2);
    expect(info.triangles).toBe(3);
    expect(info.size).toEqual([4, 3, 2]);
    expect(info.parts.map((p) => p.name)).toEqual(['socle', 'pointe']);
    scene.dispose();
  });

  it('refuse un fichier sans aucune face', () => {
    const scene = sceneWithoutWebGL();
    expect(() => scene.showObj('file:vide', 'v 0 0 0\nv 1 0 0')).toThrow();
    expect(scene.modelKey).toBeNull();
    scene.dispose();
  });

  it('cadre le modèle chargé et rend la même caméra qu’on lui donne', () => {
    const scene = sceneWithoutWebGL();
    scene.showDemo('demo:colis', 'colis');
    scene.resetCamera();
    const framed = scene.cameraState();
    expect(framed.position[1]).toBeGreaterThan(framed.target[1]);
    scene.setCamera({ position: [1, 2, 3], target: [0, 0.5, 0] });
    expect(scene.cameraState()).toEqual({ position: [1, 2, 3], target: [0, 0.5, 0] });
    scene.dispose();
  });
});
