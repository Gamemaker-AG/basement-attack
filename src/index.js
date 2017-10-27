import ECS from 'yagl-ecs';
import * as PIXI from 'pixi.js';

import Attack from 'systems/Attack';
import ButtonSystem from 'systems/Button';
import Construction from 'systems/Construction';
import Destination from 'systems/Destination';
import FadeOut from 'systems/FadeOut';
import FollowPath from 'systems/FollowPath';
import GridSystem from 'systems/Grid';
import Health from 'systems/Health';
import Movement from './systems/Movement.js';
import Render from './systems/Render.js';
import TargetInRange from './systems/TargetInRange';
import InfoPanelUpdater from 'systems/InfoPanelUpdater';
import Range from 'systems/Range';
import Spawner from 'systems/Spawner';
import UpdateGridPosition from 'systems/UpdateGridPosition';

import ObservablePixiVector from 'ObservablePixiVector';
import PixiVector from 'PixiVector';
import Player from 'Player';

import * as actions from 'button-actions';
import createGameEntities from 'createGameEntities';
import createMenuEntities from 'createMenuEntities';
import { buttonMuteEntity } from 'entities/ui';
import spriteEntity from 'entities/spriteEntity';
import globals from 'globals';

import sound from 'pixi-sound';

window.PIXI.Point.prototype = PixiVector.prototype;
window.PIXI.ObservablePoint.prototype = ObservablePixiVector.prototype;

let game;
let menu;
let currentState = menu;
let ticker, renderer;

const backgroundMusic = PIXI.sound.Sound.from('sounds/backgroundMusic.mp3');
backgroundMusic.loop = true;
backgroundMusic.play();

renderer = PIXI.autoDetectRenderer(globals.width, globals.height, {
  resolution: window.devicePixelRatio || 1
});
renderer.backgroundColor = 0xFFFFFF;
document.body.appendChild(renderer.view);
document.body.style.margin = '0';

function newState () {
  return {
    stage: new PIXI.Container(),
    ecs: new ECS()
  };
}

function gameLoop () {
  window.dt = ticker.elapsedMS * window.speed / 1000;
  currentState.ecs.update();
  renderer.render(currentState.stage);
}

function startMenu () {
  menu = newState();

  // Menu
  menu.ecs.addSystem(new Render(renderer, menu.stage, globals.width, globals.height));
  menu.ecs.addSystem(new ButtonSystem());

  createMenuEntities(startGame, backgroundMusic).forEach(e => menu.ecs.addEntity(e));

  currentState = menu;
}

function startGame () {
  globals.player = new Player(startMenu);
  window.speed = 1;
  game = newState();

  // Game
  let rangeSystem = new Range(game.stage);

  game.ecs.addSystem(new Render(renderer, game.stage, globals.width, globals.height));
  game.ecs.addSystem(new ButtonSystem(rangeSystem));
  let grid = new GridSystem(10);
  game.ecs.addSystem(grid);
  game.ecs.addSystem(new Movement());
  game.ecs.addSystem(rangeSystem);
  let targetInRange = new TargetInRange(grid.towers);
  game.ecs.addSystem(new Attack(game.ecs, targetInRange.enemies));  // TODO
  game.ecs.addSystem(new Construction());
  game.ecs.addSystem(new InfoPanelUpdater());
  game.ecs.addSystem(new UpdateGridPosition());
  game.ecs.addSystem(new FollowPath(grid.towers));
  game.ecs.addSystem(targetInRange);
  game.ecs.addSystem(new Destination(game.ecs));
  game.ecs.addSystem(new Spawner(game.ecs));
  game.ecs.addSystem(new FadeOut(game.ecs));
  game.ecs.addSystem(new Health(game.ecs));

  createGameEntities((entity) => game.ecs.addEntity(entity), backgroundMusic)
    .forEach(e => game.ecs.addEntity(e));

  currentState = game;
}

function startLoop () {
  ticker = new PIXI.ticker.Ticker();
  ticker.add(gameLoop);
  ticker.start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ticker.stop();
    } else {
      ticker.start();
    }
  });

  startMenu();
}

PIXI.loader
  .add('red_square', 'img/red_square.png')
  .add('green_square', 'img/green_square.png')
  .add('heart', 'img/heart.png')
  .add('coin', 'img/coin.png')
  .add('circular_background', 'img/circular_background.png')
  .add('creep_fast_1', 'img/creep_fast_1.png')
  .add('creep_fast_2', 'img/creep_fast_2.png')
  .add('tower_weak', 'img/tower_weak.png')
  .add('tower_weak_top', 'img/tower_weak_top.png')
  .add('tower_strong', 'img/tower_strong.png')
  .add('tower_long', 'img/tower_long.png')
  .add('slot', 'img/slot.png')
  .add('goal', 'img/goal.png')
  .add('wall', 'img/wall.png')
  .add('button_newGame', 'img/button_newGame.png')
  .add('button_credits', 'img/button_credits.png')
  .add('button_soundSpeaker', 'img/button_soundSpeaker.png')
  .add('button_soundWaves', 'img/button_soundWaves.png')
  .add('button_fast', 'img/button_fast.png')
  .add('button_slow', 'img/button_slow.png')
  .add('fak_font', 'font/fak.fnt')
  .load(startLoop);
