/** Taille maximale d'un fichier importé : au-delà, la lecture bloquerait la page trop longtemps. */
export const MAX_OBJ_BYTES = 50 * 1024 * 1024;

/** Taille lisible : « 340 Ko », « 1,2 Mo ». */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

/** Nombre entier à la française : « 12 345 ». */
export const formatCount = (value: number): string => Math.round(value).toLocaleString('fr-FR');

/** Ce qui empêche d'importer ce fichier, ou null s'il peut être lu. */
export function checkObjFile(name: string, size: number): string | null {
  if (!/\.obj$/i.test(name)) return `« ${name} » n'est pas un fichier .obj.`;
  if (size === 0) return `« ${name} » est vide.`;
  if (size > MAX_OBJ_BYTES) {
    return `« ${name} » pèse ${formatBytes(size)} : ${formatBytes(MAX_OBJ_BYTES)} au plus.`;
  }
  return null;
}

/** Un texte OBJ a au moins des sommets (« v x y z ») et des faces (« f a b c »). */
export function looksLikeObj(text: string): boolean {
  return /^v\s+\S/m.test(text) && /^f\s+\S/m.test(text);
}

/** Dimensions lisibles, avec moins de décimales pour les grands nombres : « 3,1 × 2,04 × 1 250 ». */
export function formatSize(size: readonly [number, number, number]): string {
  const one = (v: number): string => {
    const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
    return v.toLocaleString('fr-FR', { maximumFractionDigits: digits });
  };
  return size.map(one).join(' × ');
}

/** Nom affiché d'un fichier : sans son extension. */
export const modelNameOf = (fileName: string): string => fileName.replace(/\.obj$/i, '') || fileName;
