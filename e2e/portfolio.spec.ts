import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
