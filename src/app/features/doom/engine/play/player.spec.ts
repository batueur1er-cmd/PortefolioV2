import { doomAssets } from '../engine';
import { TICRATE } from './physics';
import { Player, PlayerInput } from './player';

const WALK: PlayerInput = { forward: 1, strafe: 0, turn: 0, run: false };

describe('Le joueur', () => {
  const { level, graphics } = doomAssets();
  const obstacles = level.things.map((t) => ({ x: t.x, y: t.y, radius: graphics.sprites[t.kind].radius }));
  const walk = (player: Player, tics: number, input = WALK) => {
    for (let i = 0; i < tics; i++) player.tic(input);
  };

  it('marche à environ 290 unités par seconde, comme dans Doom', () => {
    const player = new Player(level, obstacles);
    player.angle = 0;
    walk(player, TICRATE);
    expect(player.x - 96).toBeGreaterThan(200);
    expect(player.x - 96).toBeLessThan(320);
  });

  it('s’arrête contre un mur, à son rayon près', () => {
    const player = new Player(level, obstacles);
    player.angle = Math.PI;
    walk(player, 60);
    expect(player.x).toBeGreaterThanOrEqual(16);
    expect(player.x).toBeLessThan(20);
  });

  it('monte l’escalier jusqu’au balcon', () => {
    const player = new Player(level, obstacles);
    expect(player.teleport(320, 440)).toBe(true);
    player.angle = Math.PI / 2;
    walk(player, 90);
    expect(player.sector.id).toBe('balcon');
    expect(player.z).toBe(64);
    walk(player, 20, { forward: 0, strafe: 0, turn: 0, run: false });
    expect(player.eyeZ).toBe(64 + 41);
  });

  it('ne passe pas par la fenêtre : l’appui est trop haut', () => {
    const player = new Player(level, obstacles);
    expect(player.teleport(400, 832)).toBe(true);
    player.angle = 0;
    walk(player, 60);
    expect(player.x).toBeLessThan(448);
  });

  it('ne se pose ni dans un pilier, ni hors du niveau', () => {
    const player = new Player(level, obstacles);
    expect(player.teleport(320, 256)).toBe(false);
    expect(player.teleport(-50, 40)).toBe(false);
    expect(player.teleport(1200, 900)).toBe(true);
    expect(player.sector.id).toBe('cour');
  });

  it('bute contre les objets', () => {
    const player = new Player(level, obstacles);
    expect(player.teleport(560, 360)).toBe(true);
    player.angle = Math.PI / 2;
    walk(player, 40);
    expect(player.y).toBeLessThan(432 - 25);
  });
});
