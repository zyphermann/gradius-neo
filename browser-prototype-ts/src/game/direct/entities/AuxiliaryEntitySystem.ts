/** Updates entities stored in the auxiliary entity list. */
// @ts-nocheck -- progressively removed as raw state-array accesses become typed.

import { type int, type short } from '../JavaRuntime';
import { Graphics } from '../../../j2me/lcdui/Graphics';
import { RENDER_SCALE } from '../../../runtime/render-config';
import { EntityField, StateSlot } from '../state/GameState';
import { EntityPool } from './EntityPool';
import { EntityType } from './EntityType';
import { RenderQueue } from '../render/RenderQueue';

const GAME_VIEW_WIDTH = 240;

function toRenderPixels(gameCoordinate: number): number {
  return Math.trunc(gameCoordinate * RENDER_SCALE);
}

export class AuxiliaryEntitySystem {
  private entityDirectionSign = -1;
  private changedEntityCount = 0;

  constructor(
    private readonly state: Int32Array,
    private readonly entities: EntityPool,
    private readonly renderQueue: RenderQueue,
    private readonly requestSoundEffect: (soundId: number) => void,
    private readonly resolveEntityCollisions: (...args: number[]) => number,
    private readonly drawSpriteRegion: (...args: any[]) => void,
  ) {}

  private removeEntity(entityId: number): void {
    this.entities.release('auxiliary', entityId);
    this.changedEntityCount++;
  }

  private spawnEntity(type: number, x: number, y: number, packedParameters: number): number {
    return this.entities.spawn('primary', type, x, y, packedParameters);
  }

  update(gfx: Graphics): void {
    let entityId: int = this.state[StateSlot.AuxiliaryEntityHead];

    while (entityId !== -1) {
      let nextEntityId: int = this.state[EntityField.Next + entityId];
      let entityX: int = this.state[EntityField.X + entityId];
      let entityY: int = this.state[EntityField.Y + entityId];
      let age: int = this.state[EntityField.Age + entityId];
      this.entityDirectionSign = -1;
      let directionSideIndex: int = (this.entityDirectionSign + 1) / 2;
      this.changedEntityCount = 0;
      switch (this.state[EntityField.Type + entityId]) {
        case 33:
        case 34:
        case 35:
        case 36: {
          if (age === 0) {
            if (this.state[EntityField.Parameter0 + entityId] < 1) {
              this.state[EntityField.Parameter0 + entityId] = 1;
            }

            this.state[EntityField.XFixed + entityId] = this.state[EntityField.X + entityId];
            this.state[EntityField.YFixed + entityId] = this.state[EntityField.Y + entityId];
            this.state[4606 + entityId] = 0;
            this.state[5118 + entityId] = (this.state[EntityField.Type + entityId] - 33) / 2;
          }

          if (this.state[85] > 0) {
            this.state[85] = 0;
            this.removeEntity(entityId);
          } else {
            if (this.state[EntityField.Parameter3 + entityId] === 1) {
              entityX =
                this.state[EntityField.X + this.state[EntityField.Parameter2 + entityId]] +
                this.state[EntityField.XFixed + entityId];
              entityY =
                this.state[EntityField.Y + this.state[EntityField.Parameter2 + entityId]] +
                this.state[EntityField.YFixed + entityId];
            }

            if (this.state[4606 + entityId] <= 0) {
              if (this.state[EntityField.Parameter1 + entityId] === 0) {
                this.renderQueue.enqueue(
                  2,
                  entityX - 16 + directionSideIndex * 16,
                  entityY - 8,
                  14,
                  244 + (age & 1) * 1,
                  0,
                );
                if (age >= 3) {
                  this.state[4606 + entityId]++;
                }
              } else {
                if (this.state[EntityField.Parameter1 + entityId] === 1) {
                  this.renderQueue.enqueue(
                    2,
                    entityX - 16 + directionSideIndex * 16,
                    entityY - 8,
                    14,
                    244 + (age & 1) * 1,
                    0,
                  );
                  if (age >= 7) {
                    this.state[4606 + entityId]++;
                  }
                } else {
                  if (this.state[EntityField.Parameter1 + entityId] === 2) {
                    this.renderQueue.enqueue(0, entityX, entityY, 13, 401 + age, 66052);
                    if (age >= 3) {
                      this.state[4606 + entityId]++;
                    }
                  }
                }
              }
            } else {
              if (this.state[4606 + entityId] === 1) {
                this.requestSoundEffect(8);
              }

              this.renderQueue.enqueue(
                1,
                entityX,
                entityY - ((1 - this.state[5118 + entityId]) * 16) / 2,
                14,
                247 + this.state[5118 + entityId] * 2,
                0,
              );

              for (
                let var21: int = entityX + this.entityDirectionSign * 16;
                this.entityDirectionSign * var21 <= 120 + (this.entityDirectionSign * GAME_VIEW_WIDTH) / 2;
                var21 += this.entityDirectionSign * 16
              ) {
                this.renderQueue.enqueue(
                  1,
                  var21,
                  entityY - ((1 - this.state[5118 + entityId]) * 16) / 2,
                  14,
                  246 + this.state[5118 + entityId] * 2,
                  0,
                );
              }

              this.resolveEntityCollisions(
                entityId,
                directionSideIndex * entityX,
                entityY,
                this.entityDirectionSign * (directionSideIndex * GAME_VIEW_WIDTH - entityX) + 16,
                16 + this.state[5118 + entityId] * 16,
              );
              if (this.state[4606 + entityId]++ >= this.state[EntityField.Parameter0 + entityId]) {
                this.removeEntity(entityId);
              }
            }
          }
          break;
        }

        case 87: {
          if (age === 0) {
            age =
              64 + (64 / this.state[EntityField.Parameter3 + entityId]) * this.state[EntityField.Parameter2 + entityId];
            this.state[EntityField.Parameter2 + entityId] = 0;
            this.state[4606 + entityId] = 1;
            this.state[EntityField.Health + entityId] = 4 + this.state[25];
          }

          this.state[0] = age % 64;
          entityX =
            (this.state[EntityField.XFixed + this.state[EntityField.Parameter0 + entityId]] >> 4) +
            16 +
            (((this.state[455 + this.state[0]] * 16 * 3) / 2) >> 4);
          entityY =
            (this.state[EntityField.YFixed + this.state[EntityField.Parameter0 + entityId]] >> 4) +
            16 +
            ((this.state[471 + this.state[0]] * 16 * 3) >> 4);
          this.state[1] = 13;
          if (32 < this.state[0]) {
            this.state[1] = 10;
          }

          if (this.state[4606 + entityId] > 0) {
            this.renderQueue.enqueue(1, entityX, entityY, this.state[1], 291, 0);
          }

          if (this.state[4606 + entityId] <= 0) {
            this.state[4606 + entityId]++;
            if (0 < this.state[4606 + entityId]) {
              this.state[EntityField.Health + entityId] = 8;
            } else {
              if (-1 <= this.state[4606 + entityId]) {
                this.renderQueue.enqueue(1, entityX, entityY, this.state[1], 123 - this.state[4606 + entityId], 0);
              }
            }
          } else {
            if (this.state[EntityField.Parameter2 + entityId] === 0) {
              if (age % (48 - this.state[25]) === 0) {
                this.spawnEntity(21, entityX, entityY, 0);
              }
            } else {
              if (this.state[EntityField.Parameter2 + entityId] === 1) {
                if (age % (48 - this.state[25]) === 0) {
                  this.spawnEntity(26, entityX, entityY, 8);
                }
              } else {
                if (this.state[EntityField.Parameter2 + entityId] === 2 && age % (48 - this.state[25]) === 0) {
                  this.spawnEntity(23, entityX, entityY, 262960);
                }
              }
            }
          }

          if (
            this.state[9738] <= 0 &&
            (this.state[4606 + entityId] <= 0 ||
              (this.state[EntityField.Health + entityId] =
                this.state[EntityField.Health + entityId] -
                this.resolveEntityCollisions(entityId, entityX, entityY, 16, 16)) > 0)
          ) {
            break;
          }

          this.state[4606 + entityId] = -24;
          this.state[EntityField.Parameter2 + entityId] = ++this.state[EntityField.Parameter2 + entityId] % 3;
          this.state[StateSlot.Score] = this.state[StateSlot.Score] + 500;
          this.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0);
          if (this.state[9738] > 0) {
            this.removeEntity(entityId);
          }
          break;
        }

        case 95: {
          if (age === 0) {
            age = 64 + 8 * this.state[EntityField.Parameter1 + entityId];
            this.state[EntityField.Health + entityId] = 255;
          }

          this.state[0] = 64 - (age % 64);
          entityX =
            this.state[EntityField.X + this.state[EntityField.Parameter0 + entityId]] +
            48 +
            (((this.state[455 + this.state[0]] * 16 * 1) / 2) >> 4);
          entityY =
            this.state[EntityField.Y + this.state[EntityField.Parameter0 + entityId]] +
            24 +
            ((this.state[471 + this.state[0]] * 16 * 4) >> 4);
          let var12: short = 350;
          this.state[1] = 13;
          if (4 <= this.state[0] && this.state[0] <= 28) {
            var12 = 351;
            this.state[1] = 14;
          } else {
            if (36 <= this.state[0] && this.state[0] <= 60) {
              var12 = 352;
              this.state[1] = 10;
            }
          }

          this.renderQueue.enqueue(2, entityX, entityY, this.state[1], var12, 0);
          if (this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] > 0) {
            this.state[2] = this.state[EntityField.Age + this.state[EntityField.Parameter0 + entityId]];
            if (
              this.state[2] % (16 - this.state[25] / 3) === 0 &&
              this.state[2] % 10 === this.state[EntityField.Parameter1 + entityId]
            ) {
              this.spawnEntity(24, entityX, entityY, (this.state[1] << 8) | 8);
            }
          }

          if (this.state[9738] > 0) {
            this.removeEntity(entityId);
            this.spawnEntity(EntityType.ThreeFrameEffectA, entityX + 8, entityY, 0);
          }

          this.resolveEntityCollisions(entityId, entityX + 8, entityY, 24, 16);
          break;
        }

        case 98: {
          let var10: int = this.state[EntityField.Parameter1 + entityId] * 2 - 1;
          if (age === 0) {
            this.state[EntityField.Health + entityId] = 256 + this.state[25] * 8;
            this.state[EntityField.XFixed + entityId] = -4;
            this.state[EntityField.YFixed + entityId] = 10;
            if (this.state[EntityField.Parameter1 + entityId] === 1) {
              this.state[EntityField.XFixed + entityId] = -14;
              this.state[EntityField.YFixed + entityId] = 32;
            }

            this.state[4606 + entityId] = this.state[EntityField.XFixed + entityId];
            this.state[5118 + entityId] = this.state[EntityField.YFixed + entityId];
          } else {
            let var2: short = 353;
            if (this.state[EntityField.Parameter1 + entityId] === 1) {
              var2 = 354;
            }

            if (this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] === -1) {
              let var17: int = 32 - this.state[25] / 2;
              if (age % var17 === 0) {
                this.spawnEntity(
                  65,
                  entityX + 64 + 2 - ((1 - this.state[EntityField.Parameter1 + entityId]) * 16 * 5) / 8,
                  entityY + this.state[EntityField.Parameter1 + entityId] * 16 + (var10 * 16) / 4,
                  1536 | (16 - 1 * var10 * 16),
                );
              } else {
                if (age % var17 === var17 / 2) {
                  this.spawnEntity(
                    65,
                    entityX + 48 + 2 - ((1 - this.state[EntityField.Parameter1 + entityId]) * 16 * 5) / 8,
                    entityY + this.state[EntityField.Parameter1 + entityId] * 16 + (var10 * 16) / 4,
                    1536 | (16 - 1 * var10 * 16),
                  );
                }
              }
            } else {
              if (this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] >= 0) {
                this.state[0] = this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]];
                if (this.state[0] > 12) {
                  this.state[0] = 12;
                }

                this.state[EntityField.XFixed + entityId] = this.state[4606 + entityId] + (this.state[0] * 16) / 4;
                this.state[EntityField.YFixed + entityId] =
                  this.state[5118 + entityId] + (var10 * this.state[0] * 16) / 4;
              }
            }

            entityX =
              this.state[EntityField.X + this.state[EntityField.Parameter0 + entityId]] +
              this.state[EntityField.XFixed + entityId];
            entityY =
              this.state[EntityField.Y + this.state[EntityField.Parameter0 + entityId]] +
              this.state[EntityField.YFixed + entityId];
            this.renderQueue.enqueue(0, entityX, entityY, 14, var2, 393734);
            if (this.state[EntityField.Parameter1 + entityId] === 0) {
              let var18: int;
              if ((var18 = this.resolveEntityCollisions(entityId, entityX + 4, entityY + 4, 80, 24)) > 0) {
                this.state[EntityField.Health + entityId] = this.state[EntityField.Health + entityId] - var18;
              }
            } else {
              if (this.state[EntityField.Parameter1 + entityId] === 1) {
                let var19: int;
                if ((var19 = this.resolveEntityCollisions(entityId, entityX + 8, entityY + 8, 80, 16)) > 0) {
                  this.state[EntityField.Health + entityId] = this.state[EntityField.Health + entityId] - var19;
                } else {
                  if ((var19 = this.resolveEntityCollisions(entityId, entityX + 40, entityY + 24, 48, 4)) > 0) {
                    this.state[EntityField.Health + entityId] = this.state[EntityField.Health + entityId] - var19;
                  }
                }
              }
            }

            if (this.state[EntityField.Health + entityId] > 0 && this.state[9738] === 0) {
              break;
            }

            if (this.state[9738] === 0) {
              this.state[StateSlot.Score] = this.state[StateSlot.Score] + 5000;
            }

            this.state[EntityField.Parameter3 + this.state[EntityField.Parameter0 + entityId]]++;
            this.spawnEntity(20, entityX + 40, entityY + 8, 2623496);
            this.requestSoundEffect(3);
            this.removeEntity(entityId);
          }
          break;
        }

        case 110: {
          if (age === 0) {
            age = 16 + (this.state[EntityField.Parameter1 + entityId] * 64) / 4;
          } else {
            this.state[0] = (age * 2 + (this.state[EntityField.Parameter1 + entityId] * 64 * 1) / 4) % 64;
            entityX =
              this.state[EntityField.XFixed + this.state[EntityField.Parameter0 + entityId]] +
              ((this.state[455 + this.state[0]] * this.state[4606 + this.state[EntityField.Parameter0 + entityId]]) >>
                4);
            entityY =
              this.state[EntityField.YFixed + this.state[EntityField.Parameter0 + entityId]] +
              ((this.state[471 + this.state[0]] * this.state[5118 + this.state[EntityField.Parameter0 + entityId]]) >>
                4);
            if (this.state[EntityField.Parameter3 + this.state[EntityField.Parameter0 + entityId]] !== 0) {
              if (this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] === 2) {
                if (age % (24 - this.state[25] / 2 - this.state[EntityField.Parameter1 + entityId]) === 0) {
                  let var23: int = age + this.state[StateSlot.PlayerX] + this.state[StateSlot.PlayerY];
                  this.spawnEntity(
                    30,
                    entityX - 16,
                    entityY + 8 + ((this.state[1055 + (var23 & 63)] % 2) * 16) / 2,
                    8 + this.state[25] / 7,
                  );
                }
              } else {
                if (
                  this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] === 3 &&
                  age % (32 - this.state[25] / 2 - this.state[EntityField.Parameter1 + entityId] * 2) === 0
                ) {
                  this.spawnEntity(21, entityX, entityY + 8, 0);
                }
              }
            }

            this.renderQueue.enqueue(0, entityX, entityY, 13, 396, 66049);
            this.resolveEntityCollisions(entityId, entityX, entityY + 8, 16, 16);
            if (this.state[EntityField.Parameter0 + this.state[EntityField.Parameter0 + entityId]] <= -2) {
              this.requestSoundEffect(3);
              this.spawnEntity(EntityType.ThreeFrameSmallExplosion, entityX - 32, entityY, 0);
              this.removeEntity(entityId);
            }
          }
          break;
        }

        case 111: {
          if (age === 0) {
            if (this.state[EntityField.Parameter0 + entityId] === 0) {
              this.state[9741] = this.state[9743] = 24;
              this.state[StateSlot.StageScriptAdvancePerTick] = 0;
            } else {
              if (this.state[EntityField.Parameter0 + entityId] === 1) {
                this.state[StateSlot.StageScrollSpeed] = 4;
                this.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 17420);
              }
            }
          }

          if (this.state[EntityField.Parameter0 + entityId] === 0) {
            if (age === 100) {
              this.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 30);
            }

            if (this.state[EntityField.Parameter1 + entityId] === 0) {
              if (entityX <= this.entityDirectionSign * 16 * 3) {
                this.state[StateSlot.StageScrollSpeed] = 0;
                this.state[StateSlot.VisualStageScrollX] = 0;
                this.state[EntityField.Parameter1 + entityId]++;
              }
            } else {
              if (this.state[EntityField.Parameter1 + entityId] === 1) {
                this.state[9741] = this.state[9741] - 4;
                this.state[9743] = this.state[9743] - 4;
                if (this.state[9741] <= 0) {
                  this.state[9739] =
                    this.state[9740] =
                    this.state[9741] =
                    this.state[9742] =
                    this.state[9743] =
                    this.state[9744] =
                    this.state[9745] =
                    this.state[9746] =
                      0;
                  this.removeEntity(entityId);
                  this.state[41] = 7;
                  this.state[86] = 3;

                  for (let var14: int = 0; var14 < 20; var14++) {
                    this.state[9751 + var14] = 0;
                  }

                  for (let var15: int = 1; var15 < 13; var15++) {
                    this.state[1265 + var15 * 16 + ((this.state[StateSlot.CollisionMapScrollX] / 16) % 16)] = 1;
                    this.state[1265 + var15 * 16 + ((this.state[StateSlot.CollisionMapScrollX] / 16 + 14) % 16)] = 1;
                  }
                }
              }
            }
          } else {
            if (this.state[EntityField.Parameter0 + entityId] === 1) {
              if (entityX <= -304) {
                this.state[EntityField.Parameter0 + entityId]++;
                this.state[5118 + entityId] = 4;
                this.state[StateSlot.StageScrollSpeed] = 0;
                this.state[StateSlot.CollisionMapScrollX] = 0;
                this.state[StateSlot.VisualStageScrollX] = 0;
              }
            } else {
              if (this.state[EntityField.Parameter0 + entityId] === 2) {
                if (--this.state[5118 + entityId] <= 0) {
                  this.state[41] = 8;
                  this.state[StateSlot.StageScriptAdvancePerTick] = 1;
                  this.removeEntity(entityId);
                }

                if (this.state[22] === 0) {
                  this.renderQueue.enqueue(1, 0, 0, 0, this.state[5118 + entityId], 0);
                }
              }
            }
          }

          if (this.state[EntityField.Parameter0 + entityId] === 2) {
            break;
          }

          this.renderQueue.enqueue(0, entityX + 32, 16, 6, 336, 66305);
          this.renderQueue.enqueue(1, entityX + 32, 64, 6, 339, 0);
          this.renderQueue.enqueue(1, entityX + 32, 144, 6, 340, 0);
          this.renderQueue.enqueue(0, entityX + 32, 160, 6, 336, 66305);
          this.renderQueue.enqueue(0, entityX + 48, 16, 6, 335, 66305);
          this.renderQueue.enqueue(1, entityX + 48, 64, 6, 337, 0);
          this.renderQueue.enqueue(1, entityX + 48, 144, 6, 338, 0);
          this.renderQueue.enqueue(0, entityX + 48, 160, 6, 335, 66305);
          this.renderQueue.enqueue(0, entityX + 272, 16, 6, 336, 66305);
          this.renderQueue.enqueue(1, entityX + 272, 64, 6, 339, 0);
          this.renderQueue.enqueue(1, entityX + 272, 144, 6, 340, 0);
          this.renderQueue.enqueue(0, entityX + 272, 160, 6, 336, 66305);
          this.renderQueue.enqueue(1, entityX + 32, entityY, 7, 342, 0);
          this.renderQueue.enqueue(1, entityX + 32, entityY + 208, 7, 344, 0);
          this.renderQueue.enqueue(1, entityX + 48, entityY, 7, 341, 0);
          this.renderQueue.enqueue(1, entityX + 48, entityY + 208, 7, 343, 0);
          this.renderQueue.enqueue(1, entityX + 272, entityY, 7, 342, 0);
          this.renderQueue.enqueue(1, entityX + 272, entityY + 208, 7, 344, 0);
          this.renderQueue.enqueue(0, entityX + 136, entityY + 0 - this.state[9744], 7, 345, 131329);
          this.renderQueue.enqueue(0, entityX + 168, entityY + 0 + this.state[9744], 7, 346, 131329);
          this.renderQueue.enqueue(0, entityX + 136, entityY + 208 - this.state[9746], 7, 345, 131329);
          this.renderQueue.enqueue(0, entityX + 168, entityY + 208 + this.state[9746], 7, 346, 131329);
          this.renderQueue.enqueue(0, entityX + 32, entityY + 80 - this.state[9741], 7, 347, 66049);
          this.renderQueue.enqueue(0, entityX + 32, entityY + 112 + this.state[9741], 7, 348, 66049);
          this.renderQueue.enqueue(0, entityX + 48, entityY + 80 - this.state[9743], 7, 347, 66049);
          this.renderQueue.enqueue(0, entityX + 48, entityY + 112 + this.state[9743], 7, 348, 66049);
          this.renderQueue.enqueue(0, entityX + 272, entityY + 80 - this.state[9745], 7, 347, 66049);
          this.renderQueue.enqueue(0, entityX + 272, entityY + 112 + this.state[9745], 7, 348, 66049);
          this.resolveEntityCollisions(entityId, entityX + 32, entityY + 16, 32, 72);
          this.resolveEntityCollisions(entityId, entityX + 32, entityY + 136, 32, 72);
          if (this.state[EntityField.Parameter0 + entityId] === 0) {
            this.resolveEntityCollisions(entityId, entityX + 272, entityY + 16, 16, 192);
          } else {
            if (this.state[EntityField.Parameter0 + entityId] !== 1) {
              break;
            }

            this.renderQueue.enqueue(0, entityX + 288, entityY + 80 - 24, 7, 347, 66049);
            this.renderQueue.enqueue(0, entityX + 288, entityY + 112 + 24, 7, 348, 66049);
            this.renderQueue.enqueue(1, entityX + 288, 0, 6, 338, 0);
            this.renderQueue.enqueue(0, entityX + 288, 16, 6, 335, 66305);
            this.renderQueue.enqueue(1, entityX + 288, 64, 6, 337, 0);
            this.renderQueue.enqueue(1, entityX + 288, 144, 6, 338, 0);
            this.renderQueue.enqueue(0, entityX + 288, 160, 6, 335, 66305);
            this.renderQueue.enqueue(1, entityX + 288, 208, 6, 337, 0);

            for (let var16: int = 0; var16 < 5; var16++) {
              this.renderQueue.enqueue(0, entityX + 48 + var16 * 16 * 3, 0, 6, 333, 196867);
              this.renderQueue.enqueue(0, entityX + 48 + var16 * 16 * 3, 208, 6, 334, 196867);
            }

            this.resolveEntityCollisions(entityId, entityX + 272, entityY + 16, 32, 64);
            this.resolveEntityCollisions(entityId, entityX + 272, entityY + 144, 32, 64);
            this.resolveEntityCollisions(entityId, entityX + 48, entityY + 0, GAME_VIEW_WIDTH, 16);
            this.resolveEntityCollisions(entityId, entityX + 48, entityY + 208, GAME_VIEW_WIDTH, 16);
          }
          break;
        }

        case 112: {
          if (age === 0) {
            this.state[94] = 0;
            this.state[95] = 0;
          }

          if (this.state[EntityField.Parameter3 + entityId] === 0) {
            switch (this.state[EntityField.Parameter0 + entityId]) {
              case 1: {
                this.spawnEntity(103, 0, 0, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 2: {
                this.spawnEntity(101, 0, 0, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 3: {
                this.spawnEntity(61, GAME_VIEW_WIDTH, 32, 16777217);
                this.state[94]++;
                this.spawnEntity(61, GAME_VIEW_WIDTH, 64, 16777217);
                this.state[94]++;
                this.spawnEntity(59, GAME_VIEW_WIDTH, 160, 16777217);
                this.state[94]++;
                this.spawnEntity(59, GAME_VIEW_WIDTH, 192, 16777217);
                this.state[94]++;
                this.spawnEntity(62, -32, 32, 16777217);
                this.state[94]++;
                this.spawnEntity(62, -32, 64, 16777217);
                this.state[94]++;
                this.spawnEntity(60, -32, 160, 16777217);
                this.state[94]++;
                this.spawnEntity(60, -32, 192, 16777217);
                this.state[94]++;
                this.state[EntityField.Parameter1 + entityId] = 140;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 4: {
                if (age % 16 === 0) {
                  let var11: int =
                    this.state[StateSlot.Score] / 100 +
                    this.state[StateSlot.PlayerX] +
                    this.state[StateSlot.PlayerY] +
                    this.state[EntityField.Parameter2 + entityId];
                  this.state[0] = (this.state[1055 + (var11 & 63)] & 15) % 12;
                  this.spawnEntity(
                    43,
                    GAME_VIEW_WIDTH,
                    16 * (this.state[0] + 1),
                    (((this.state[EntityField.Parameter2 + entityId] & 1) + 1) << 24) |
                      (this.state[EntityField.Parameter2 + entityId] << 16) |
                      0 |
                      (4 + this.state[25] / 7),
                  );
                  this.state[94]++;
                  this.state[EntityField.Parameter2 + entityId]++;
                  this.state[EntityField.Parameter2 + entityId] = this.state[EntityField.Parameter2 + entityId] & 7;
                }

                if (age >= GAME_VIEW_WIDTH) {
                  this.state[EntityField.Parameter3 + entityId]++;
                  this.state[EntityField.Parameter1 + entityId] = 280;
                }
                break;
              }

              case 5: {
                if (age === 0) {
                  this.state[94] = 8;
                }

                if (age % 90 === 0) {
                  this.spawnEntity(59, GAME_VIEW_WIDTH, 176, 257);
                  this.spawnEntity(62, -32, 32, 257);
                } else {
                  if (age % 45 === 0) {
                    this.spawnEntity(61, GAME_VIEW_WIDTH, 32, 257);
                    this.spawnEntity(60, -32, 176, 257);
                  }
                }

                if (age >= 135) {
                  this.state[EntityField.Parameter3 + entityId]++;
                  this.state[EntityField.Parameter1 + entityId] = 225;
                }
                break;
              }

              case 6: {
                this.spawnEntity(100, 0, 0, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 7: {
                this.spawnEntity(103, 0, 0, 1);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 8: {
                if (age === 0) {
                  this.state[94] = 2;
                  this.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0);
                }

                if (age === 48) {
                  this.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0);
                  this.state[EntityField.Parameter3 + entityId]++;
                }
                break;
              }

              case 9: {
                this.spawnEntity(86, GAME_VIEW_WIDTH, 144, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 10: {
                this.spawnEntity(102, 0, 0, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 11: {
                this.spawnEntity(80, 112, 112, 4);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 12: {
                for (let var13: int = 0; var13 < 14; var13++) {
                  this.spawnEntity(74 + var13 / 7, GAME_VIEW_WIDTH - (var13 / 7) * 272, 16 + (var13 % 7) * 16 * 2, 0);
                  this.state[94]++;
                }

                this.state[EntityField.Parameter1 + entityId] = 180;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 13: {
                this.spawnEntity(105, 0, 0, 1);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 14: {
                this.spawnEntity(78, GAME_VIEW_WIDTH, 48, 0);
                this.state[94]++;
                this.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 15: {
                this.spawnEntity(105, 0, 0, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 16: {
                this.spawnEntity(101, 0, 0, 1);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 17: {
                this.spawnEntity(80, 112, 112, 1);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 18: {
                this.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0);
                this.state[94]++;
                this.spawnEntity(78, -32, 48, 0);
                this.state[94]++;
                this.state[EntityField.Parameter3 + entityId]++;
                break;
              }

              case 19: {
                if (age === 0) {
                  this.state[94] = 3;
                  this.spawnEntity(79, GAME_VIEW_WIDTH, 104, 0);
                }

                if (age === 32) {
                  this.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0);
                }

                if (age === 64) {
                  this.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0);
                  this.state[EntityField.Parameter3 + entityId]++;
                }
              }

              default:
            }
          }

          if (
            this.state[94] <= this.state[95] ||
            (this.state[EntityField.Parameter1 + entityId] !== 0 &&
              age >= this.state[EntityField.Parameter1 + entityId])
          ) {
            this.removeEntity(entityId);
            this.state[86] = 3;
          }
          break;
        }

        case 113: {
          if (this.state[EntityField.Parameter0 + entityId] === 0) {
            if (this.state[StateSlot.VisualStageScrollX] % 48 === 0) {
              this.state[StateSlot.VisualStageScrollX] = this.state[StateSlot.VisualStageScrollX] - 2;
              this.state[41] = 0;
              this.state[EntityField.Parameter0 + entityId]++;
            }
          } else {
            if (this.state[EntityField.Parameter0 + entityId] !== 1) {
              if (this.state[EntityField.Parameter0 + entityId] === 2) {
                if (--this.state[4606 + entityId] <= 0) {
                  this.state[41] = 9;
                  this.state[StateSlot.StageScrollSpeed] = 2;
                  this.state[StateSlot.StageScriptAdvancePerTick] = 1;
                  this.removeEntity(entityId);
                }

                if (this.state[22] === 0) {
                  this.renderQueue.enqueue(3, 0, 0, 0, this.state[4606 + entityId], 0);
                }
              }
            } else {
              this.state[StateSlot.VisualStageScrollX] = this.state[StateSlot.VisualStageScrollX] + 2;
              if (this.state[22] === 0) {
                for (let var3: int = 0; var3 < 5; var3++) {
                  this.drawSpriteRegion(
                    gfx,
                    4,
                    299,
                    0,
                    toRenderPixels(
                      ((entityY - GAME_VIEW_WIDTH) / 48) * 48 -
                        (this.state[StateSlot.VisualStageScrollX] % 48) +
                        var3 * 48,
                    ),
                    20,
                  );
                  this.drawSpriteRegion(
                    gfx,
                    4,
                    300,
                    132,
                    toRenderPixels(
                      ((entityY - GAME_VIEW_WIDTH) / 48) * 48 -
                        (this.state[StateSlot.VisualStageScrollX] % 48) +
                        var3 * 48,
                    ),
                    20,
                  );
                }
              }

              this.renderQueue.enqueue(0, 0, entityY, 6, 334, 196865);
              this.renderQueue.enqueue(0, 48, entityY, 6, 334, 196865);
              this.renderQueue.enqueue(0, 144, entityY, 6, 334, 196865);
              this.renderQueue.enqueue(0, 192, entityY, 6, 334, 196865);
              this.renderQueue.enqueue(0, 0, entityY + 16, 6, 333, 196865);
              this.renderQueue.enqueue(0, 48, entityY + 16, 6, 333, 196865);
              this.renderQueue.enqueue(0, 144, entityY + 16, 6, 333, 196865);
              this.renderQueue.enqueue(0, 192, entityY + 16, 6, 333, 196865);
              this.renderQueue.enqueue(0, 64, entityY, 7, 345, 131329);
              this.renderQueue.enqueue(0, 144, entityY, 7, 346, 131329);
              this.renderQueue.enqueue(0, 64, entityY + 16, 7, 345, 131329);
              this.renderQueue.enqueue(0, 144, entityY + 16, 7, 346, 131329);
              this.resolveEntityCollisions(entityId, 0, entityY, 96, 32);
              this.resolveEntityCollisions(entityId, 144, entityY, 96, 32);
              if (entityY <= -48) {
                this.state[EntityField.Parameter0 + entityId]++;
                this.state[StateSlot.CollisionMapScrollX] = 0;
                this.state[StateSlot.VisualStageScrollX] = 0;
                this.state[4606 + entityId] = 4;
              } else {
                entityY -= 2;
              }
            }
          }
        }

        default:
      }

      if (this.changedEntityCount === 0) {
        this.state[EntityField.X + entityId] =
          entityX + this.state[StateSlot.StageScrollSpeed] * this.entityDirectionSign;
        this.state[EntityField.Y + entityId] = entityY;
        this.state[EntityField.Age + entityId] = ++age;
      }

      entityId = nextEntityId;
    }
  }
}
