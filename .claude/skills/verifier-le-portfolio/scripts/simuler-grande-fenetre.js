// Simule une grande fenêtre portfolio ouverte à côté de cet onglet, sur le bus « pv2:windows ».
// À passer tel quel à l'outil javascript_tool du navigateur intégré, sur un onglet au PREMIER PLAN
// rétréci avec resize_window (par exemple 480 × 380) : un onglet en arrière-plan ne fait pas
// tourner requestAnimationFrame, la loupe resterait « en attente ».
// Renvoie l'état de l'onglet après 1,5 s et la transformation attendue, à comparer.
await (async () => {
  const OFFSET = { x: 200, y: 300 }; // position de la loupe dans le portfolio simulé
  const SCROLL_Y = 1500; // défilement simulé du portfolio
  const LAYOUT = { w: 1440, h: 900 }; // taille de la fausse grande fenêtre

  clearInterval(window.__pv2FakeTimer);
  window.__pv2Fake?.close();
  const border = (outerWidth - innerWidth) / 2;
  const origin = { x: screenX + border, y: screenY + outerHeight - innerHeight - border };
  window.__pv2Fake = new BroadcastChannel('pv2:windows');
  window.__pv2FakeTimer = setInterval(
    () =>
      window.__pv2Fake.postMessage({
        kind: 'state',
        state: {
          kind: 'main',
          id: 'fausse-grande-fenetre',
          t: Date.now(),
          origin: { x: origin.x - OFFSET.x, y: origin.y - OFFSET.y },
          viewport: LAYOUT,
          small: false,
          layoutWidth: LAYOUT.w,
          scroll: { x: 0, y: SCROLL_Y },
        },
      }),
    150,
  );

  await new Promise((resolve) => setTimeout(resolve, 1500));
  const copy = document.querySelector('.lens-page');
  const aboutGrid = copy?.querySelector('app-about-section .grid');
  const pivot = { x: innerWidth / 2, y: innerHeight / 2 };
  return {
    role: document.querySelector('app-lens-view') ? 'loupe' : document.querySelector('app-main-view') ? 'portfolio' : 'en écoute',
    titre: document.title,
    largeurCopie: copy?.style.width ?? null,
    transformation: copy?.style.transform ?? null,
    attendu: `translate(${pivot.x}px, ${pivot.y}px) scale(1) translate(${-OFFSET.x - pivot.x}px, ${-OFFSET.y - SCROLL_Y - pivot.y}px)`,
    section: document.querySelector('app-lens-hud .where')?.textContent?.trim() ?? null,
    // Deux colonnes attendues : la copie garde la mise en page du bureau malgré la petite fenêtre.
    colonnesProfil: aboutGrid ? getComputedStyle(aboutGrid).gridTemplateColumns : null,
  };
})();
