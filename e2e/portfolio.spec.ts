import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

/** Ouvre le terminal caché et renvoie son champ de saisie. */
async function openTerminal(page: Page) {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('`');
  const field = page.getByRole('dialog', { name: 'Terminal du portfolio' }).locator('input');
  await expect(field).toBeFocused();
  return field;
}

test.describe('portfolio', () => {
  test('affiche l’accueil avec ses balises de partage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Baptiste Nodon/);
    await expect(page.locator('h1')).toContainText('Baptiste');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\/portfolio\.png/);
    await expect(page.getByRole('button', { name: /Télécharger le CV/ })).toBeVisible();
  });

  test('ouvre une page projet avec ses propres balises', async ({ page }) => {
    await page.goto('/projets/argus');
    await expect(page.locator('h1')).toHaveText('Argus');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Argus/);
  });

  test('une page projet montre son schéma et le compte pour « Lecteur de plans »', async ({ page }) => {
    await page.goto('/projets/argus');
    const blueprint = page.locator('.blueprint');
    await blueprint.scrollIntoViewIfNeeded();
    await expect(blueprint.locator('svg text').first()).toBeVisible();
    await expect(blueprint.locator('figcaption')).toContainText('3 tiers');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pv2.schemas-seen'))).toContain('argus');
  });

  test('télécharge le CV en PDF', async ({ page }) => {
    await page.goto('/');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Télécharger le CV/ }).click();
    expect((await download).suggestedFilename()).toBe('CV-Baptiste-Nodon.pdf');
  });

  test('le terminal caché répond à whoami', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('`');
    const field = page.getByRole('dialog', { name: 'Terminal du portfolio' }).locator('input');
    await expect(field).toBeFocused();
    await field.fill('whoami');
    await field.press('Enter');
    await expect(page.getByRole('log')).toContainText('Quercy Réfrigération');
  });

  test('les secrets trouvés restent après un rechargement, jusqu’à « oublier secrets »', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pv2.secrets.found', JSON.stringify(['nav-version', 'skills-pix'])));
    await page.reload();
    const field = await openTerminal(page);
    await field.fill('secrets');
    await field.press('Enter');
    await expect(page.getByRole('log')).toContainText(/2\/\d+ secrets trouvés/);
    await field.fill('oublier secrets');
    await field.press('Enter');
    await expect(page.getByRole('log')).toContainText('la chasse repart de zéro');
    expect(await page.evaluate(() => localStorage.getItem('pv2.secrets.found'))).toBe('[]');
  });

  test('le terminal oublie les succès et ouvre la singularité', async ({ page }) => {
    await page.goto('/');
    const field = await openTerminal(page);
    await field.fill('oublier succes');
    await field.press('Enter');
    await expect(page.getByRole('log')).toContainText('Succès oubliés.');
    expect(await page.evaluate(() => localStorage.getItem('pv2.achievements'))).toBe('[]');
    await field.fill('singularite');
    await field.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Singularité' })).toBeVisible({ timeout: 10_000 });
  });

  test('depuis une page projet, « singularite » ramène à l’accueil et l’ouvre', async ({ page }) => {
    await page.goto('/projets/argus');
    const field = await openTerminal(page);
    await field.fill('singularite');
    await field.press('Enter');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog', { name: 'Singularité' })).toBeVisible({ timeout: 10_000 });
  });

  test('matrix fait pleuvoir des caractères et débloque « Pilule rouge »', async ({ page }) => {
    await page.goto('/');
    const field = await openTerminal(page);
    await field.fill('matrix');
    await field.press('Enter');
    await expect(page.locator('app-matrix-rain')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('app-matrix-rain')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('pv2.achievements'))).toContain('pilule-rouge');
  });

  test('une seconde fenêtre rétrécie devient la loupe', async ({ context }) => {
    const main = await context.newPage();
    await main.setViewportSize({ width: 1280, height: 800 });
    await main.goto('/');
    const lens = await context.newPage();
    await lens.setViewportSize({ width: 520, height: 420 });
    await lens.goto('/');
    await expect(lens.locator('html')).toHaveClass(/lens-mode/, { timeout: 10_000 });
    await expect(lens.locator('app-lens-hud')).toContainText(/Secrets 0\/\d+/);
    // Le portfolio voit la loupe arriver.
    await expect(main.locator('app-lens-frames .frame')).toHaveCount(1, { timeout: 10_000 });
  });

  test('le code Konami dans la loupe passe le portfolio en rayons X', async ({ context }) => {
    const main = await context.newPage();
    await main.setViewportSize({ width: 1280, height: 800 });
    await main.goto('/');
    const lens = await context.newPage();
    await lens.setViewportSize({ width: 520, height: 420 });
    await lens.goto('/');
    await expect(lens.locator('html')).toHaveClass(/lens-mode/, { timeout: 10_000 });
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) {
      await lens.keyboard.press(key);
    }
    await expect(main.locator('app-main-view app-portfolio-page').first()).toHaveClass(/xray/);
  });

  test('la loupe recopie la fenêtre des autres projets sur toute sa hauteur', async ({ context }) => {
    const main = await context.newPage();
    await main.setViewportSize({ width: 1280, height: 800 });
    await main.goto('/');
    const lens = await context.newPage();
    await lens.setViewportSize({ width: 520, height: 420 });
    await lens.goto('/');
    await expect(lens.locator('html')).toHaveClass(/lens-mode/, { timeout: 10_000 });
    await main.getByRole('button', { name: /autres projets/ }).click();
    const real = await main.locator('.mat-mdc-dialog-content').evaluate((e) => e.clientHeight);
    const copy = lens.locator('app-projects-mirror .mirror-content');
    await expect.poll(() => copy.evaluate((e) => Math.round(e.getBoundingClientRect().height))).toBeGreaterThan(real - 4);
  });

  test('une page projet ouvre la fenêtre de tous les projets, recopiée par la loupe', async ({ context }) => {
    const main = await context.newPage();
    await main.setViewportSize({ width: 1280, height: 800 });
    await main.goto('/projets/crm');
    const lens = await context.newPage();
    await lens.setViewportSize({ width: 520, height: 420 });
    await lens.goto('/');
    await expect(lens.locator('html')).toHaveClass(/lens-mode/, { timeout: 10_000 });
    await main.getByRole('button', { name: 'Afficher tous les projets' }).click();
    const dialog = main.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Tous les projets' })).toBeVisible();
    const count = await dialog.locator('.item').count();
    expect(count).toBeGreaterThan(3);
    await expect(lens.locator('app-projects-mirror .item')).toHaveCount(count);
    await expect(lens.locator('app-projects-mirror .title')).toHaveText('Tous les projets');
    // Choisir un projet ferme la fenêtre et change de page.
    await dialog.getByRole('link', { name: 'Argus' }).click();
    await expect(main).toHaveURL(/projets\/argus/);
    await expect(main.getByRole('dialog')).toHaveCount(0);
  });

  for (const theme of ['clair', 'nuit']) {
    test(`passe l’audit d’accessibilité (thème ${theme})`, async ({ page }) => {
      await page.goto(`/?simple=1&theme=${theme}`);
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }

  test('passe l’audit d’accessibilité sur une page projet', async ({ page }) => {
    await page.goto('/projets/drive?simple=1');
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id} : ${v.nodes.length} élément(s)`)).toEqual([]);
  });
});
