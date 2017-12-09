import ECS from 'yagl-ecs';
import Sprite from 'components/Sprite.js';
import GridPosition from 'components/GridPosition';
import PixiVector from 'PixiVector';
import globals from 'globals';
import { tower_types } from 'entities/towers';
import ZIndex from 'components/ZIndex';
import * as actions from 'button-actions';
import upgradeMenuEntity from 'entities/upgradeMenu';

export default function constructionMenuEntity (addEntity, removeEntity) {
  let entity = new ECS.Entity(null, [Sprite, GridPosition, ZIndex]);
  entity.components.zIndex.index = globals.zIndexes - 1;
  entity.components.sprite.pixiSprite = new PIXI.Container();
  entity.components.sprite.pixiSprite.visible = false;

  let background = new PIXI.Sprite(PIXI.loader.resources['circular_background'].texture);
  background.anchor.set(0.5, 0.5);
  background.position.set(0, 0);
  background.scale.set(0.7);
  background.alpha = 0.5;
  background.interactive = true;

  let backgroundClick = () => {
    entity.components.sprite.pixiSprite.visible = false;
  };

  background.click = backgroundClick;
  background.on('tap', backgroundClick);

  entity.components.sprite.pixiSprite.addChild(background);

  let towers = tower_types.filter(tower => {
    return tower.type === 'standard';
  });
  let angle = (Math.PI * 2) / towers.length;

  towers.forEach((tower, index) => {
    let pos = new PixiVector(background.height / 2, 0).rotate((angle * index) - Math.PI / 2);
    let towerEntity = tower.factory(pos.x, pos.y);

    let clickaction = () => {
      let worldCoords = entity.components.sprite.pixiSprite.position;

      if (towerEntity.components.purchased.cost <= globals.player.gold) {
        globals.player.gold -= towerEntity.components.purchased.cost;
        console.log('Constructing at:',
          entity.components.gridPosition.x,
          entity.components.gridPosition.y
        );

        let towerToAdd = tower.factory(worldCoords.x, worldCoords.y);
        let worldPos = new PixiVector(entity.components.sprite.pixiSprite.x, entity.components.sprite.pixiSprite.y);
        let upgradeMenu = upgradeMenuEntity(addEntity, removeEntity, tower.factory.name, towerToAdd);
        towerToAdd.components.button.actions.click = [actions.TOGGLE_TOWER_MENU, upgradeMenu, worldPos, entity.components.gridPosition];

        addEntity(upgradeMenu);
        addEntity(towerToAdd);
      }

      entity.components.sprite.pixiSprite.visible = false;
    };

    towerEntity.components.sprite.pixiSprite.click = clickaction;
    towerEntity.components.sprite.pixiSprite.on('tap', clickaction);

    // WARNING: DANGER ZONE
    // Don't touch this code it's horrible.
    // We need an entity to hold the sprite so we can do updates on it.
    // But the render system destroys the children realtionship of the menu and the towers on `enter`
    // So we need a component that is not touched by the Render system.
    // We call it the `systemlessSprite`.
    let dumb_entity = new ECS.Entity(null, []);
    dumb_entity.addComponent('menuTower', {});
    dumb_entity.addComponent('purchased', towerEntity.components.purchased);
    dumb_entity.components.systemlessSprite = towerEntity.components.sprite;

    entity.components.sprite.pixiSprite.addChild(dumb_entity.components.systemlessSprite.pixiSprite);

    addEntity(dumb_entity);
  });

  return entity;
};
