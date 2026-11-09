import { buildLevel } from '../level/level';
import { DOOR_WAIT } from './physics';
import { Doors } from './doors';
import { Player } from './player';

describe('Les portes', () => {
  const FAR = { x: 96, y: 96 };

  it('s’ouvrent quand on les utilise de près, pas de loin', () => {
    const level = buildLevel();
    const doors = new Doors(level);
    expect(doors.use(600, 256, 0)).toBe(false);
    expect(doors.use(760, 256, 0)).toBe(true);
    expect(doors.tic(FAR.x, FAR.y)).toBe(true);
    expect(doors.heights[0]).toBe(2);
  });

  it('montent 4 unités sous le plafond voisin, attendent, puis se referment', () => {
    const level = buildLevel();
    const doors = new Doors(level);
    doors.use(760, 256, 0);
    for (let i = 0; i < 62; i++) doors.tic(FAR.x, FAR.y);
    expect(doors.heights[0]).toBe(124);
    for (let i = 0; i < DOOR_WAIT + 62; i++) doors.tic(FAR.x, FAR.y);
    expect(doors.heights[0]).toBe(0);
  });

  it('ne se referment pas sur le joueur', () => {
    const level = buildLevel();
    const doors = new Doors(level);
    doors.use(760, 256, 0);
    for (let i = 0; i < 62 + DOOR_WAIT + 10; i++) doors.tic(816, 256);
    expect(doors.heights[0]).toBeGreaterThan(100);
  });

  it('bloquent le passage fermées, le laissent ouvertes, sans toucher à l’arbre', () => {
    const level = buildLevel();
    const nodes = level.nodes.length;
    const doors = new Doors(level);
    const player = new Player(level);
    player.teleport(770, 256);
    player.angle = 0;
    const walk = () => {
      for (let i = 0; i < 40; i++) player.tic({ forward: 1, strafe: 0, turn: 0, run: false });
    };
    walk();
    expect(player.x).toBeLessThan(800);
    doors.use(player.x, player.y, player.angle);
    for (let i = 0; i < 62; i++) doors.tic(FAR.x, FAR.y);
    walk();
    expect(player.x).toBeGreaterThan(832);
    expect(level.nodes.length).toBe(nodes);
  });
});
