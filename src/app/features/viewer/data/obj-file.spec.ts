import { MAX_OBJ_BYTES, checkObjFile, formatBytes, formatCount, formatSize, looksLikeObj, modelNameOf } from './obj-file';

const TETRA = ['# un tétraèdre', 'v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'v 0 0 1', 'f 1 2 3', 'f 1 2 4', 'f 1 3 4', 'f 2 3 4'].join(
  '\n',
);

describe('fichiers OBJ', () => {
  it('refuse ce qui n’est pas un .obj, un fichier vide ou trop lourd', () => {
    expect(checkObjFile('scene.glb', 100)).toContain('n\'est pas un fichier .obj');
    expect(checkObjFile('vide.obj', 0)).toContain('est vide');
    expect(checkObjFile('gros.obj', MAX_OBJ_BYTES + 1)).toContain('50 Mo au plus');
    expect(checkObjFile('Pièce.OBJ', 2048)).toBeNull();
  });

  it('reconnaît un texte OBJ à ses sommets et à ses faces', () => {
    expect(looksLikeObj(TETRA)).toBe(true);
    expect(looksLikeObj('v 0 0 0\nv 1 0 0')).toBe(false);
    expect(looksLikeObj('<html>pas un modèle</html>')).toBe(false);
  });

  it('écrit les tailles et les nombres à la française', () => {
    expect(formatBytes(512)).toBe('512 o');
    expect(formatBytes(2048)).toBe('2 Ko');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5,5 Mo');
    expect(formatCount(12345).replace(/\s/g, ' ')).toBe('12 345');
    expect(formatSize([3.104, 12.56, 1250]).replace(/\s/g, ' ')).toBe('3,1 × 12,6 × 1 250');
  });

  it('nomme un modèle d’après son fichier, sans l’extension', () => {
    expect(modelNameOf('moteur.obj')).toBe('moteur');
    expect(modelNameOf('.obj')).toBe('.obj');
  });
});
