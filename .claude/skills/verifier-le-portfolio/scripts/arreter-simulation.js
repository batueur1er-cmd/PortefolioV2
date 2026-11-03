// Fait disparaître la fausse grande fenêtre de simuler-grande-fenetre.js : l'onglet doit redevenir
// le portfolio (transition « Mode portfolio »). Renvoie son rôle après 1,5 s.
await (async () => {
  clearInterval(window.__pv2FakeTimer);
  window.__pv2Fake?.postMessage({ kind: 'bye', id: 'fausse-grande-fenetre' });
  window.__pv2Fake?.close();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    role: document.querySelector('app-lens-view') ? 'loupe' : document.querySelector('app-main-view') ? 'portfolio' : 'en écoute',
    titre: document.title,
  };
})();
