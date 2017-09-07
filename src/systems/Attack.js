import ECS from 'yagl-ecs';
import globals from 'globals';
import lineShot from 'entities/lineShot';
import PixiVector from 'PixiVector';

export default class Attack extends ECS.System {
  constructor (ecs, freq) {
    super(freq);
    this.ecs = ecs;
    this.enemies = {};
    this.unitToAttack = null;
  }

  test (entity) {
    return (entity.components.enemy && entity.components.sprite) ||
      (entity.components.range && entity.components.attack && entity.components.sprite);
  }

  enter (entity) {
    if (entity.components.enemy) this.enemies[entity.id] = entity;
  }

  exit (entity) {
    if (entity.components.enemy) delete this.enemies[entity.id];
  }

  update (entity) {
    let { range, attack, sprite } = entity.components;

    if (range && attack) {
      let {position: pos} = sprite.pixiSprite;

      for (let enemy of Object.values(this.enemies)) {
        let {position: enemyPos} = enemy.components.sprite.pixiSprite;

        if (pos.distance(enemyPos) <= range.range * globals.slotSize) {
          if (!this.unitToAttack) {
            this.unitToAttack = enemy;
          }

          let {position: unitToAttackPos} = this.unitToAttack.components.sprite.pixiSprite;
          let posVec = new PixiVector(pos.x, pos.y);
          let enemyPosVec = new PixiVector(unitToAttackPos.x, unitToAttackPos.y);

          if (sprite.pixiSprite.children.length === 0) {
            sprite.pixiSprite.rotation = ((enemyPosVec.subtract(posVec)).horizontalAngle);
          } else {
            sprite.pixiSprite.getChildAt(0).rotation = ((enemyPosVec.subtract(posVec)).horizontalAngle);
          }

          if (attack.timeSinceLastAttack >= (1 / attack.rate)) {
            this.attack(entity, this.unitToAttack);
            attack.timeSinceLastAttack = 0;
          }
        } else if (this.unitToAttack === enemy) {
          this.unitToAttack = null;
        }
      }

      attack.timeSinceLastAttack += window.dt;
    }
  }

  attack (tower, enemy) {
    let {position: origin} = tower.components.sprite.pixiSprite;
    let {position: target} = enemy.components.sprite.pixiSprite;
    this.ecs.addEntity(lineShot(origin, target));
    enemy.components.health.health -= tower.components.attack.damage;

    if (enemy.components.health.health <= 0) {
      this.unitToAttack = null;
    }
  }
};
