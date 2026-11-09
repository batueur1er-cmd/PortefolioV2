/*
 * Les réglages du joueur, ceux de Doom : le jeu avance par « tics » de 1/35 s. Chaque tic, la
 * poussée des touches s'ajoute à l'élan, que le frottement réduit ensuite. Le joueur est un
 * cylindre de 32 × 56 ; il franchit les marches de 24 au plus et ses yeux sont à 41 au-dessus de ses pieds.
 */

export const TICRATE = 35;
export const TIC_MS = 1000 / TICRATE;
export const PLAYER_RADIUS = 16;
export const PLAYER_HEIGHT = 56;
export const VIEW_HEIGHT = 41;
export const MAX_STEP = 24;
/** La distance à laquelle le joueur atteint une porte. */
export const USE_RANGE = 64;
/** Une porte bouge de 2 unités par tic et reste ouverte 150 tics. */
export const DOOR_SPEED = 2;
export const DOOR_WAIT = 150;

/** Frottement au sol : l'élan est multiplié par 0xE800 / 0x10000 à chaque tic. */
export const FRICTION = 0xe800 / 0x10000;
export const STOP_SPEED = 0x1000 / 0x10000;
export const GRAVITY = 1;
/** Un déplacement par tic ne dépasse pas 30 unités ; au-delà de 15, il est fait en deux fois. */
export const MAX_MOVE = 30;
/** Poussée par tic en marchant puis en courant, en avant puis de côté. */
export const FORWARD = [(25 * 2048) / 65536, (50 * 2048) / 65536] as const;
export const SIDE = [(24 * 2048) / 65536, (40 * 2048) / 65536] as const;
/** Rotation par tic : 640 puis 1 280 unités d'angle sur 65 536 pour un tour. */
export const TURN = [(640 / 65536) * 2 * Math.PI, (1280 / 65536) * 2 * Math.PI] as const;
