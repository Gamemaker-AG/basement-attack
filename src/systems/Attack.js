import ECS from 'yagl-ecs';
import shot from 'entities/shot';
import PixiVector from 'PixiVector';

export default class Attack extends ECS.System {
  constructor (ecs, freq) {
    super(freq);
    this.ecs = ecs;
  }

  test (entity) {
    return entity.components.attack && !entity.components.fadeOut && !entity.components.bullet;
  }

  enter (entity) {
    entity.components.attack.timeSinceLastAttack = 1 / entity.components.attack.rate;
  }

  update (entity) {
    let {attack} = entity.components;

    if (attack.unitToAttack &&
      attack.timeSinceLastAttack >= (1 / attack.rate)) {
      this.attack(entity, attack.unitToAttack);
      attack.timeSinceLastAttack = 0;
    }

    attack.timeSinceLastAttack += window.dt;
  }

  attack (source, enemy) {
    let {position: origin} = source.components.sprite.pixiSprite;
    let {position: target} = enemy.components.sprite.pixiSprite;

    this.ecs.addEntity(shot(origin, enemy, source));

    // if (source.components.slow) {
    //   if (source.components.slow.duration > enemy.components.movement.slowDuration) {
    //     enemy.components.movement.slowDuration = source.components.slow.duration
    //   }

    //   enemy.components.movement.speedFactor = source.components.slow.speedFactor
    // }

    // if (source.components.poison) {
    //   if (source.components.poison.duration > enemy.components.movement.poisonDuration) {
    //     enemy.components.movement.poisonDuration = source.components.poison.duration
    //   }

    //   enemy.components.movement.poisonAmount = source.components.poison.poisonAmount
    // }

    if (source.components.enemy) {
      enemy.components.health.health -= source.components.attack.damage;
    }
  }
};
