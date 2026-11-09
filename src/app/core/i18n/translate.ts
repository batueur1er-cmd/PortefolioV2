export type Dictionary = ReadonlyMap<string, string>;
/** Pour un texte dont une partie varie : un motif et son remplacement. */
export type Rule = readonly [pattern: RegExp, replacement: string];

/** La traduction d'un texte entier, ou null s'il n'y en a pas (les espaces autour sont gardés). */
export function translateText(text: string, dictionary: Dictionary, rules: readonly Rule[] = []): string | null {
  const key = text.trim().replace(/\s+/g, ' ');
  if (!key) return null;
  const exact = dictionary.get(key);
  const found = exact ?? rules.find(([pattern]) => pattern.test(key));
  if (found === undefined) return null;
  const english = typeof found === 'string' ? found : key.replace(found[0], found[1]);
  const start = text.length - text.trimStart().length;
  const end = text.trimEnd().length;
  return text.slice(0, start) + english + text.slice(end);
}

/** La même structure, chaque chaîne connue traduite : les identifiants, absents du dictionnaire, ne bougent pas. */
export function translateDeep<T>(value: T, dictionary: Dictionary): T {
  if (typeof value === 'string') return (dictionary.get(value) ?? value) as T;
  if (Array.isArray(value)) return value.map((item) => translateDeep(item, dictionary)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translateDeep(item, dictionary)])) as T;
  }
  return value;
}

const ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder'];

/**
 * Traduit les textes écrits dans les gabarits, à mesure qu'ils apparaissent ou changent. Le français
 * reste la source : les gabarits ne portent aucune clé, et rien de tout ça ne tourne en français.
 */
export function translateDom(root: HTMLElement, dictionary: Dictionary, rules: readonly Rule[]): () => void {
  const fixText = (node: Text) => {
    const english = translateText(node.data, dictionary, rules);
    if (english !== null && english !== node.data) node.data = english;
  };
  const fixElement = (element: Element) => {
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      const english = value === null ? null : translateText(value, dictionary, rules);
      if (english !== null && english !== value) element.setAttribute(name, english);
    }
  };
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      fixText(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    fixElement(node as Element);
    const walker = (node.ownerDocument ?? document).createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current.nodeType === Node.TEXT_NODE) fixText(current as Text);
      else fixElement(current as Element);
    }
  };
  visit(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(visit);
      else if (record.type === 'characterData') fixText(record.target as Text);
      else fixElement(record.target as Element);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
  return () => observer.disconnect();
}
