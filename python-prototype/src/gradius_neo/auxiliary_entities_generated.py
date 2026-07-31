"""Generated mechanically from GradiusNeoGame.ts. Do not edit by hand."""
SOURCE_SHA256 = "28f05ff8724d134133ab8abf0732a11cb7d485194d99fb167483f7c4427c457e"
import math
from enum import IntEnum
from gradius_neo.generated_runtime import *
from gradius_neo.integer_math import int_div, to_byte, to_int, to_short, unsigned_right_shift
RENDER_SCALE = 3 / 4
SPRITE_SHEET_SCALE = 3 / 4

class _SwitchBreak(Exception):
    pass

def todo_expr(kind, source):
    raise NotImplementedError(f"TODO-PORT expression {kind}: {source}")
def todo_statement(kind, source):
    raise NotImplementedError(f"TODO-PORT statement {kind}: {source}")
def _set_item(container, index, value):
    container[index] = value
    return value
def _set_attr(owner, name, value):
    setattr(owner, name, value)
    return value
def _mutate_item(container, index, delta, postfix):
    old = container[index]
    container[index] = old + delta
    return old if postfix else container[index]
def _mutate_attr(owner, name, delta, postfix):
    old = getattr(owner, name)
    setattr(owner, name, old + delta)
    return old if postfix else getattr(owner, name)
def _fill(values, value):
    values[:] = [value] * len(values)
    return values

GAME_VIEW_WIDTH = 240

def toRenderPixels(gameCoordinate):
    return int((gameCoordinate * RENDER_SCALE))

class AuxiliaryEntitySystem:
    def __init__(self, state, entities, renderQueue, requestSoundEffect, resolveEntityCollisions, drawSpriteRegion):
        self.state = state
        self.entities = entities
        self.renderQueue = renderQueue
        self.requestSoundEffect = requestSoundEffect
        self.resolveEntityCollisions = resolveEntityCollisions
        self.drawSpriteRegion = drawSpriteRegion
        self.entityDirectionSign = (-1)
        self.changedEntityCount = 0
        pass
    
    def removeEntity(self, entityId):
        self.entities.release("auxiliary", entityId)
        self.changedEntityCount += 1
    
    def spawnEntity(self, type, x, y, packedParameters):
        return self.entities.spawn("primary", type, x, y, packedParameters)
    
    def update(self, gfx):
        entityId = self.state[StateSlot.AuxiliaryEntityHead]
        while (entityId != (-1)):
            nextEntityId = self.state[(EntityField.Next + entityId)]
            entityX = self.state[(EntityField.X + entityId)]
            entityY = self.state[(EntityField.Y + entityId)]
            age = self.state[(EntityField.Age + entityId)]
            self.entityDirectionSign = (-1)
            directionSideIndex = int_div(((self.entityDirectionSign + 1)), 2)
            self.changedEntityCount = 0
            self.renderQueue.beginEntity(entityId)
            try:
                match self.state[(EntityField.Type + entityId)]:
                    case 33 | 34 | 35 | 36:
                        if (age == 0):
                            if (self.state[(EntityField.Parameter0 + entityId)] < 1):
                                self.state[(EntityField.Parameter0 + entityId)] = 1
                            self.state[(EntityField.XFixed + entityId)] = self.state[(EntityField.X + entityId)]
                            self.state[(EntityField.YFixed + entityId)] = self.state[(EntityField.Y + entityId)]
                            self.state[(4606 + entityId)] = 0
                            self.state[(5118 + entityId)] = int_div(((self.state[(EntityField.Type + entityId)] - 33)), 2)
                        if (self.state[85] > 0):
                            self.state[85] = 0
                            self.removeEntity(entityId)
                        else:
                            if (self.state[(EntityField.Parameter3 + entityId)] == 1):
                                entityX = (self.state[(EntityField.X + self.state[(EntityField.Parameter2 + entityId)])] + self.state[(EntityField.XFixed + entityId)])
                                entityY = (self.state[(EntityField.Y + self.state[(EntityField.Parameter2 + entityId)])] + self.state[(EntityField.YFixed + entityId)])
                            if (self.state[(4606 + entityId)] <= 0):
                                if (self.state[(EntityField.Parameter1 + entityId)] == 0):
                                    self.renderQueue.enqueue(2, ((entityX - 16) + (directionSideIndex * 16)), (entityY - 8), 14, (244 + (((age & 1)) * 1)), 0)
                                    if (age >= 3):
                                        self.state[(4606 + entityId)] += 1
                                else:
                                    if (self.state[(EntityField.Parameter1 + entityId)] == 1):
                                        self.renderQueue.enqueue(2, ((entityX - 16) + (directionSideIndex * 16)), (entityY - 8), 14, (244 + (((age & 1)) * 1)), 0)
                                        if (age >= 7):
                                            self.state[(4606 + entityId)] += 1
                                    else:
                                        if (self.state[(EntityField.Parameter1 + entityId)] == 2):
                                            self.renderQueue.enqueue(0, entityX, entityY, 13, (401 + age), 66052)
                                            if (age >= 3):
                                                self.state[(4606 + entityId)] += 1
                            else:
                                if (self.state[(4606 + entityId)] == 1):
                                    self.requestSoundEffect(8)
                                self.renderQueue.enqueue(1, entityX, (entityY - int_div(((((1 - self.state[(5118 + entityId)])) * 16)), 2)), 14, (247 + (self.state[(5118 + entityId)] * 2)), 0)
                                # TODO-PORT general for-loop: for ( let var21: number = entityX + this.entityDirectionSign * 16; this.entityDirectionSign * var21 <= 120 + (this.entityDirectionSign * GAME_VIEW_WIDTH) / 2; var21 += this.entityD
                                var21 = (entityX + (self.entityDirectionSign * 16))
                                while ((self.entityDirectionSign * var21) <= (120 + int_div(((self.entityDirectionSign * GAME_VIEW_WIDTH)), 2))):
                                    self.renderQueue.enqueue(1, var21, (entityY - int_div(((((1 - self.state[(5118 + entityId)])) * 16)), 2)), 14, (246 + (self.state[(5118 + entityId)] * 2)), 0)
                                    (var21 := (var21 + (self.entityDirectionSign * 16)))
                                self.resolveEntityCollisions(entityId, (directionSideIndex * entityX), entityY, ((self.entityDirectionSign * (((directionSideIndex * GAME_VIEW_WIDTH) - entityX))) + 16), (16 + (self.state[(5118 + entityId)] * 16)))
                                if (_mutate_item(self.state, (4606 + entityId), 1, True) >= self.state[(EntityField.Parameter0 + entityId)]):
                                    self.removeEntity(entityId)
                        raise _SwitchBreak()
                    case 87:
                        if (age == 0):
                            age = (64 + ((int_div(64, self.state[(EntityField.Parameter3 + entityId)])) * self.state[(EntityField.Parameter2 + entityId)]))
                            self.state[(EntityField.Parameter2 + entityId)] = 0
                            self.state[(4606 + entityId)] = 1
                            self.state[(EntityField.Health + entityId)] = (4 + self.state[25])
                        self.state[0] = (age % 64)
                        entityX = ((((self.state[(EntityField.XFixed + self.state[(EntityField.Parameter0 + entityId)])] >> 4)) + 16) + (((int_div((((self.state[(455 + self.state[0])] * 16) * 3)), 2)) >> 4)))
                        entityY = ((((self.state[(EntityField.YFixed + self.state[(EntityField.Parameter0 + entityId)])] >> 4)) + 16) + (((((self.state[(471 + self.state[0])] * 16) * 3)) >> 4)))
                        self.state[1] = 13
                        if (32 < self.state[0]):
                            self.state[1] = 10
                        if (self.state[(4606 + entityId)] > 0):
                            self.renderQueue.enqueue(1, entityX, entityY, self.state[1], 291, 0)
                        if (self.state[(4606 + entityId)] <= 0):
                            self.state[(4606 + entityId)] += 1
                            if (0 < self.state[(4606 + entityId)]):
                                self.state[(EntityField.Health + entityId)] = 8
                            else:
                                if ((-1) <= self.state[(4606 + entityId)]):
                                    self.renderQueue.enqueue(1, entityX, entityY, self.state[1], (123 - self.state[(4606 + entityId)]), 0)
                        else:
                            if (self.state[(EntityField.Parameter2 + entityId)] == 0):
                                if ((age % ((48 - self.state[25]))) == 0):
                                    self.spawnEntity(21, entityX, entityY, 0)
                            else:
                                if (self.state[(EntityField.Parameter2 + entityId)] == 1):
                                    if ((age % ((48 - self.state[25]))) == 0):
                                        self.spawnEntity(26, entityX, entityY, 8)
                                else:
                                    if ((self.state[(EntityField.Parameter2 + entityId)] == 2) and ((age % ((48 - self.state[25]))) == 0)):
                                        self.spawnEntity(23, entityX, entityY, 262960)
                        if ((self.state[9738] <= 0) and (((self.state[(4606 + entityId)] <= 0) or ((_set_item(self.state, (EntityField.Health + entityId), (self.state[(EntityField.Health + entityId)] - self.resolveEntityCollisions(entityId, entityX, entityY, 16, 16)))) > 0)))):
                            raise _SwitchBreak()
                        self.state[(4606 + entityId)] = (-24)
                        self.state[(EntityField.Parameter2 + entityId)] = (_mutate_item(self.state, (EntityField.Parameter2 + entityId), 1, False) % 3)
                        self.state[StateSlot.Score] = (self.state[StateSlot.Score] + 500)
                        self.spawnEntity(EntityType.ThreeFrameEffectA, entityX, entityY, 0)
                        if (self.state[9738] > 0):
                            self.removeEntity(entityId)
                        raise _SwitchBreak()
                    case 95:
                        if (age == 0):
                            age = (64 + (8 * self.state[(EntityField.Parameter1 + entityId)]))
                            self.state[(EntityField.Health + entityId)] = 255
                        self.state[0] = (64 - ((age % 64)))
                        entityX = ((self.state[(EntityField.X + self.state[(EntityField.Parameter0 + entityId)])] + 48) + (((int_div((((self.state[(455 + self.state[0])] * 16) * 1)), 2)) >> 4)))
                        entityY = ((self.state[(EntityField.Y + self.state[(EntityField.Parameter0 + entityId)])] + 24) + (((((self.state[(471 + self.state[0])] * 16) * 4)) >> 4)))
                        var12 = 350
                        self.state[1] = 13
                        if ((4 <= self.state[0]) and (self.state[0] <= 28)):
                            var12 = 351
                            self.state[1] = 14
                        else:
                            if ((36 <= self.state[0]) and (self.state[0] <= 60)):
                                var12 = 352
                                self.state[1] = 10
                        self.renderQueue.enqueue(2, entityX, entityY, self.state[1], var12, 0)
                        if (self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] > 0):
                            self.state[2] = self.state[(EntityField.Age + self.state[(EntityField.Parameter0 + entityId)])]
                            if (((self.state[2] % ((16 - int_div(self.state[25], 3)))) == 0) and ((self.state[2] % 10) == self.state[(EntityField.Parameter1 + entityId)])):
                                self.spawnEntity(24, entityX, entityY, (((self.state[1] << 8)) | 8))
                        if (self.state[9738] > 0):
                            self.removeEntity(entityId)
                            self.spawnEntity(EntityType.ThreeFrameEffectA, (entityX + 8), entityY, 0)
                        self.resolveEntityCollisions(entityId, (entityX + 8), entityY, 24, 16)
                        raise _SwitchBreak()
                    case 98:
                        var10 = ((self.state[(EntityField.Parameter1 + entityId)] * 2) - 1)
                        if (age == 0):
                            self.state[(EntityField.Health + entityId)] = (256 + (self.state[25] * 8))
                            self.state[(EntityField.XFixed + entityId)] = (-4)
                            self.state[(EntityField.YFixed + entityId)] = 10
                            if (self.state[(EntityField.Parameter1 + entityId)] == 1):
                                self.state[(EntityField.XFixed + entityId)] = (-14)
                                self.state[(EntityField.YFixed + entityId)] = 32
                            self.state[(4606 + entityId)] = self.state[(EntityField.XFixed + entityId)]
                            self.state[(5118 + entityId)] = self.state[(EntityField.YFixed + entityId)]
                        else:
                            var2 = 353
                            if (self.state[(EntityField.Parameter1 + entityId)] == 1):
                                var2 = 354
                            if (self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] == (-1)):
                                var17 = (32 - int_div(self.state[25], 2))
                                if ((age % var17) == 0):
                                    self.spawnEntity(65, (((entityX + 64) + 2) - int_div((((((1 - self.state[(EntityField.Parameter1 + entityId)])) * 16) * 5)), 8)), ((entityY + (self.state[(EntityField.Parameter1 + entityId)] * 16)) + int_div(((var10 * 16)), 4)), (1536 | ((16 - ((1 * var10) * 16)))))
                                else:
                                    if ((age % var17) == int_div(var17, 2)):
                                        self.spawnEntity(65, (((entityX + 48) + 2) - int_div((((((1 - self.state[(EntityField.Parameter1 + entityId)])) * 16) * 5)), 8)), ((entityY + (self.state[(EntityField.Parameter1 + entityId)] * 16)) + int_div(((var10 * 16)), 4)), (1536 | ((16 - ((1 * var10) * 16)))))
                            else:
                                if (self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] >= 0):
                                    self.state[0] = self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])]
                                    if (self.state[0] > 12):
                                        self.state[0] = 12
                                    self.state[(EntityField.XFixed + entityId)] = (self.state[(4606 + entityId)] + int_div(((self.state[0] * 16)), 4))
                                    self.state[(EntityField.YFixed + entityId)] = (self.state[(5118 + entityId)] + int_div((((var10 * self.state[0]) * 16)), 4))
                            entityX = (self.state[(EntityField.X + self.state[(EntityField.Parameter0 + entityId)])] + self.state[(EntityField.XFixed + entityId)])
                            entityY = (self.state[(EntityField.Y + self.state[(EntityField.Parameter0 + entityId)])] + self.state[(EntityField.YFixed + entityId)])
                            self.renderQueue.enqueue(0, entityX, entityY, 14, var2, 393734)
                            if (self.state[(EntityField.Parameter1 + entityId)] == 0):
                                var18 = None
                                if (((var18 := self.resolveEntityCollisions(entityId, (entityX + 4), (entityY + 4), 80, 24))) > 0):
                                    self.state[(EntityField.Health + entityId)] = (self.state[(EntityField.Health + entityId)] - var18)
                            else:
                                if (self.state[(EntityField.Parameter1 + entityId)] == 1):
                                    var19 = None
                                    if (((var19 := self.resolveEntityCollisions(entityId, (entityX + 8), (entityY + 8), 80, 16))) > 0):
                                        self.state[(EntityField.Health + entityId)] = (self.state[(EntityField.Health + entityId)] - var19)
                                    else:
                                        if (((var19 := self.resolveEntityCollisions(entityId, (entityX + 40), (entityY + 24), 48, 4))) > 0):
                                            self.state[(EntityField.Health + entityId)] = (self.state[(EntityField.Health + entityId)] - var19)
                            if ((self.state[(EntityField.Health + entityId)] > 0) and (self.state[9738] == 0)):
                                raise _SwitchBreak()
                            if (self.state[9738] == 0):
                                self.state[StateSlot.Score] = (self.state[StateSlot.Score] + 5000)
                            self.state[(EntityField.Parameter3 + self.state[(EntityField.Parameter0 + entityId)])] += 1
                            self.spawnEntity(20, (entityX + 40), (entityY + 8), 2623496)
                            self.requestSoundEffect(3)
                            self.removeEntity(entityId)
                        raise _SwitchBreak()
                    case 110:
                        if (age == 0):
                            age = (16 + int_div(((self.state[(EntityField.Parameter1 + entityId)] * 64)), 4))
                        else:
                            self.state[0] = ((((age * 2) + int_div((((self.state[(EntityField.Parameter1 + entityId)] * 64) * 1)), 4))) % 64)
                            entityX = (self.state[(EntityField.XFixed + self.state[(EntityField.Parameter0 + entityId)])] + ((((self.state[(455 + self.state[0])] * self.state[(4606 + self.state[(EntityField.Parameter0 + entityId)])])) >> 4)))
                            entityY = (self.state[(EntityField.YFixed + self.state[(EntityField.Parameter0 + entityId)])] + ((((self.state[(471 + self.state[0])] * self.state[(5118 + self.state[(EntityField.Parameter0 + entityId)])])) >> 4)))
                            if (self.state[(EntityField.Parameter3 + self.state[(EntityField.Parameter0 + entityId)])] != 0):
                                if (self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] == 2):
                                    if ((age % (((24 - int_div(self.state[25], 2)) - self.state[(EntityField.Parameter1 + entityId)]))) == 0):
                                        var23 = ((age + self.state[StateSlot.PlayerX]) + self.state[StateSlot.PlayerY])
                                        self.spawnEntity(30, (entityX - 16), ((entityY + 8) + int_div(((((self.state[(1055 + ((var23 & 63)))] % 2)) * 16)), 2)), (8 + int_div(self.state[25], 7)))
                                else:
                                    if ((self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] == 3) and ((age % (((32 - int_div(self.state[25], 2)) - (self.state[(EntityField.Parameter1 + entityId)] * 2)))) == 0)):
                                        self.spawnEntity(21, entityX, (entityY + 8), 0)
                            self.renderQueue.enqueue(0, entityX, entityY, 13, 396, 66049)
                            self.resolveEntityCollisions(entityId, entityX, (entityY + 8), 16, 16)
                            if (self.state[(EntityField.Parameter0 + self.state[(EntityField.Parameter0 + entityId)])] <= (-2)):
                                self.requestSoundEffect(3)
                                self.spawnEntity(EntityType.ThreeFrameSmallExplosion, (entityX - 32), entityY, 0)
                                self.removeEntity(entityId)
                        raise _SwitchBreak()
                    case 111:
                        if (age == 0):
                            if (self.state[(EntityField.Parameter0 + entityId)] == 0):
                                self.state[9741] = _set_item(self.state, 9743, 24)
                                self.state[StateSlot.StageScriptAdvancePerTick] = 0
                            else:
                                if (self.state[(EntityField.Parameter0 + entityId)] == 1):
                                    self.state[StateSlot.StageScrollSpeed] = 4
                                    self.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 17420)
                        if (self.state[(EntityField.Parameter0 + entityId)] == 0):
                            if (age == 100):
                                self.spawnEntity(EntityType.DelayedBackgroundMusic, GAME_VIEW_WIDTH, 0, 30)
                            if (self.state[(EntityField.Parameter1 + entityId)] == 0):
                                if (entityX <= ((self.entityDirectionSign * 16) * 3)):
                                    self.state[StateSlot.StageScrollSpeed] = 0
                                    self.state[StateSlot.VisualStageScrollX] = 0
                                    self.state[(EntityField.Parameter1 + entityId)] += 1
                            else:
                                if (self.state[(EntityField.Parameter1 + entityId)] == 1):
                                    self.state[9741] = (self.state[9741] - 4)
                                    self.state[9743] = (self.state[9743] - 4)
                                    if (self.state[9741] <= 0):
                                        self.state[9739] = _set_item(self.state, 9740, _set_item(self.state, 9741, _set_item(self.state, 9742, _set_item(self.state, 9743, _set_item(self.state, 9744, _set_item(self.state, 9745, _set_item(self.state, 9746, 0)))))))
                                        self.removeEntity(entityId)
                                        self.state[41] = 7
                                        self.state[86] = 3
                                        for var14 in range(0, 20):
                                            self.state[(9751 + var14)] = 0
                                        for var15 in range(1, 13):
                                            self.state[((1265 + (var15 * 16)) + (((int_div(self.state[StateSlot.CollisionMapScrollX], 16)) % 16)))] = 1
                                            self.state[((1265 + (var15 * 16)) + ((((int_div(self.state[StateSlot.CollisionMapScrollX], 16) + 14)) % 16)))] = 1
                        else:
                            if (self.state[(EntityField.Parameter0 + entityId)] == 1):
                                if (entityX <= (-304)):
                                    self.state[(EntityField.Parameter0 + entityId)] += 1
                                    self.state[(5118 + entityId)] = 4
                                    self.state[StateSlot.StageScrollSpeed] = 0
                                    self.state[StateSlot.CollisionMapScrollX] = 0
                                    self.state[StateSlot.VisualStageScrollX] = 0
                            else:
                                if (self.state[(EntityField.Parameter0 + entityId)] == 2):
                                    if (_mutate_item(self.state, (5118 + entityId), -1, False) <= 0):
                                        self.state[41] = 8
                                        self.state[StateSlot.StageScriptAdvancePerTick] = 1
                                        self.removeEntity(entityId)
                                    if (self.state[22] == 0):
                                        self.renderQueue.enqueue(1, 0, 0, 0, self.state[(5118 + entityId)], 0)
                        if (self.state[(EntityField.Parameter0 + entityId)] == 2):
                            raise _SwitchBreak()
                        self.renderQueue.enqueue(0, (entityX + 32), 16, 6, 336, 66305)
                        self.renderQueue.enqueue(1, (entityX + 32), 64, 6, 339, 0)
                        self.renderQueue.enqueue(1, (entityX + 32), 144, 6, 340, 0)
                        self.renderQueue.enqueue(0, (entityX + 32), 160, 6, 336, 66305)
                        self.renderQueue.enqueue(0, (entityX + 48), 16, 6, 335, 66305)
                        self.renderQueue.enqueue(1, (entityX + 48), 64, 6, 337, 0)
                        self.renderQueue.enqueue(1, (entityX + 48), 144, 6, 338, 0)
                        self.renderQueue.enqueue(0, (entityX + 48), 160, 6, 335, 66305)
                        self.renderQueue.enqueue(0, (entityX + 272), 16, 6, 336, 66305)
                        self.renderQueue.enqueue(1, (entityX + 272), 64, 6, 339, 0)
                        self.renderQueue.enqueue(1, (entityX + 272), 144, 6, 340, 0)
                        self.renderQueue.enqueue(0, (entityX + 272), 160, 6, 336, 66305)
                        self.renderQueue.enqueue(1, (entityX + 32), entityY, 7, 342, 0)
                        self.renderQueue.enqueue(1, (entityX + 32), (entityY + 208), 7, 344, 0)
                        self.renderQueue.enqueue(1, (entityX + 48), entityY, 7, 341, 0)
                        self.renderQueue.enqueue(1, (entityX + 48), (entityY + 208), 7, 343, 0)
                        self.renderQueue.enqueue(1, (entityX + 272), entityY, 7, 342, 0)
                        self.renderQueue.enqueue(1, (entityX + 272), (entityY + 208), 7, 344, 0)
                        self.renderQueue.enqueue(0, (entityX + 136), ((entityY + 0) - self.state[9744]), 7, 345, 131329)
                        self.renderQueue.enqueue(0, (entityX + 168), ((entityY + 0) + self.state[9744]), 7, 346, 131329)
                        self.renderQueue.enqueue(0, (entityX + 136), ((entityY + 208) - self.state[9746]), 7, 345, 131329)
                        self.renderQueue.enqueue(0, (entityX + 168), ((entityY + 208) + self.state[9746]), 7, 346, 131329)
                        self.renderQueue.enqueue(0, (entityX + 32), ((entityY + 80) - self.state[9741]), 7, 347, 66049)
                        self.renderQueue.enqueue(0, (entityX + 32), ((entityY + 112) + self.state[9741]), 7, 348, 66049)
                        self.renderQueue.enqueue(0, (entityX + 48), ((entityY + 80) - self.state[9743]), 7, 347, 66049)
                        self.renderQueue.enqueue(0, (entityX + 48), ((entityY + 112) + self.state[9743]), 7, 348, 66049)
                        self.renderQueue.enqueue(0, (entityX + 272), ((entityY + 80) - self.state[9745]), 7, 347, 66049)
                        self.renderQueue.enqueue(0, (entityX + 272), ((entityY + 112) + self.state[9745]), 7, 348, 66049)
                        self.resolveEntityCollisions(entityId, (entityX + 32), (entityY + 16), 32, 72)
                        self.resolveEntityCollisions(entityId, (entityX + 32), (entityY + 136), 32, 72)
                        if (self.state[(EntityField.Parameter0 + entityId)] == 0):
                            self.resolveEntityCollisions(entityId, (entityX + 272), (entityY + 16), 16, 192)
                        else:
                            if (self.state[(EntityField.Parameter0 + entityId)] != 1):
                                raise _SwitchBreak()
                            self.renderQueue.enqueue(0, (entityX + 288), ((entityY + 80) - 24), 7, 347, 66049)
                            self.renderQueue.enqueue(0, (entityX + 288), ((entityY + 112) + 24), 7, 348, 66049)
                            self.renderQueue.enqueue(1, (entityX + 288), 0, 6, 338, 0)
                            self.renderQueue.enqueue(0, (entityX + 288), 16, 6, 335, 66305)
                            self.renderQueue.enqueue(1, (entityX + 288), 64, 6, 337, 0)
                            self.renderQueue.enqueue(1, (entityX + 288), 144, 6, 338, 0)
                            self.renderQueue.enqueue(0, (entityX + 288), 160, 6, 335, 66305)
                            self.renderQueue.enqueue(1, (entityX + 288), 208, 6, 337, 0)
                            for var16 in range(0, 5):
                                self.renderQueue.enqueue(0, ((entityX + 48) + ((var16 * 16) * 3)), 0, 6, 333, 196867)
                                self.renderQueue.enqueue(0, ((entityX + 48) + ((var16 * 16) * 3)), 208, 6, 334, 196867)
                            self.resolveEntityCollisions(entityId, (entityX + 272), (entityY + 16), 32, 64)
                            self.resolveEntityCollisions(entityId, (entityX + 272), (entityY + 144), 32, 64)
                            self.resolveEntityCollisions(entityId, (entityX + 48), (entityY + 0), GAME_VIEW_WIDTH, 16)
                            self.resolveEntityCollisions(entityId, (entityX + 48), (entityY + 208), GAME_VIEW_WIDTH, 16)
                        raise _SwitchBreak()
                    case 112:
                        if (age == 0):
                            self.state[94] = 0
                            self.state[95] = 0
                        if (self.state[(EntityField.Parameter3 + entityId)] == 0):
                            try:
                                match self.state[(EntityField.Parameter0 + entityId)]:
                                    case 1:
                                        self.spawnEntity(103, 0, 0, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 2:
                                        self.spawnEntity(101, 0, 0, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 3:
                                        self.spawnEntity(61, GAME_VIEW_WIDTH, 32, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(61, GAME_VIEW_WIDTH, 64, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(59, GAME_VIEW_WIDTH, 160, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(59, GAME_VIEW_WIDTH, 192, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(62, (-32), 32, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(62, (-32), 64, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(60, (-32), 160, 16777217)
                                        self.state[94] += 1
                                        self.spawnEntity(60, (-32), 192, 16777217)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter1 + entityId)] = 140
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 4:
                                        if ((age % 16) == 0):
                                            var11 = (((int_div(self.state[StateSlot.Score], 100) + self.state[StateSlot.PlayerX]) + self.state[StateSlot.PlayerY]) + self.state[(EntityField.Parameter2 + entityId)])
                                            self.state[0] = (((self.state[(1055 + ((var11 & 63)))] & 15)) % 12)
                                            self.spawnEntity(43, GAME_VIEW_WIDTH, (16 * ((self.state[0] + 1))), (((((((((self.state[(EntityField.Parameter2 + entityId)] & 1)) + 1)) << 24)) | ((self.state[(EntityField.Parameter2 + entityId)] << 16))) | 0) | ((4 + int_div(self.state[25], 7)))))
                                            self.state[94] += 1
                                            self.state[(EntityField.Parameter2 + entityId)] += 1
                                            self.state[(EntityField.Parameter2 + entityId)] = (self.state[(EntityField.Parameter2 + entityId)] & 7)
                                        if (age >= GAME_VIEW_WIDTH):
                                            self.state[(EntityField.Parameter3 + entityId)] += 1
                                            self.state[(EntityField.Parameter1 + entityId)] = 280
                                        raise _SwitchBreak()
                                    case 5:
                                        if (age == 0):
                                            self.state[94] = 8
                                        if ((age % 90) == 0):
                                            self.spawnEntity(59, GAME_VIEW_WIDTH, 176, 257)
                                            self.spawnEntity(62, (-32), 32, 257)
                                        else:
                                            if ((age % 45) == 0):
                                                self.spawnEntity(61, GAME_VIEW_WIDTH, 32, 257)
                                                self.spawnEntity(60, (-32), 176, 257)
                                        if (age >= 135):
                                            self.state[(EntityField.Parameter3 + entityId)] += 1
                                            self.state[(EntityField.Parameter1 + entityId)] = 225
                                        raise _SwitchBreak()
                                    case 6:
                                        self.spawnEntity(100, 0, 0, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 7:
                                        self.spawnEntity(103, 0, 0, 1)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 8:
                                        if (age == 0):
                                            self.state[94] = 2
                                            self.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0)
                                        if (age == 48):
                                            self.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0)
                                            self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 9:
                                        self.spawnEntity(86, GAME_VIEW_WIDTH, 144, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 10:
                                        self.spawnEntity(102, 0, 0, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 11:
                                        self.spawnEntity(80, 112, 112, 4)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 12:
                                        for var13 in range(0, 14):
                                            self.spawnEntity((74 + int_div(var13, 7)), (GAME_VIEW_WIDTH - ((int_div(var13, 7)) * 272)), (16 + ((((var13 % 7)) * 16) * 2)), 0)
                                            self.state[94] += 1
                                        self.state[(EntityField.Parameter1 + entityId)] = 180
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 13:
                                        self.spawnEntity(105, 0, 0, 1)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 14:
                                        self.spawnEntity(78, GAME_VIEW_WIDTH, 48, 0)
                                        self.state[94] += 1
                                        self.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 15:
                                        self.spawnEntity(105, 0, 0, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 16:
                                        self.spawnEntity(101, 0, 0, 1)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 17:
                                        self.spawnEntity(80, 112, 112, 1)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 18:
                                        self.spawnEntity(78, GAME_VIEW_WIDTH, 144, 0)
                                        self.state[94] += 1
                                        self.spawnEntity(78, (-32), 48, 0)
                                        self.state[94] += 1
                                        self.state[(EntityField.Parameter3 + entityId)] += 1
                                        raise _SwitchBreak()
                                    case 19:
                                        if (age == 0):
                                            self.state[94] = 3
                                            self.spawnEntity(79, GAME_VIEW_WIDTH, 104, 0)
                                        if (age == 32):
                                            self.spawnEntity(79, GAME_VIEW_WIDTH, 48, 0)
                                        if (age == 64):
                                            self.spawnEntity(79, GAME_VIEW_WIDTH, 160, 0)
                                            self.state[(EntityField.Parameter3 + entityId)] += 1
                                    case _:
                                        pass
                            except _SwitchBreak:
                                pass
                        if ((self.state[94] <= self.state[95]) or (((self.state[(EntityField.Parameter1 + entityId)] != 0) and (age >= self.state[(EntityField.Parameter1 + entityId)])))):
                            self.removeEntity(entityId)
                            self.state[86] = 3
                        raise _SwitchBreak()
                    case 113:
                        if (self.state[(EntityField.Parameter0 + entityId)] == 0):
                            if ((self.state[StateSlot.VisualStageScrollX] % 48) == 0):
                                self.state[StateSlot.VisualStageScrollX] = (self.state[StateSlot.VisualStageScrollX] - 2)
                                self.state[41] = 0
                                self.state[(EntityField.Parameter0 + entityId)] += 1
                        else:
                            if (self.state[(EntityField.Parameter0 + entityId)] != 1):
                                if (self.state[(EntityField.Parameter0 + entityId)] == 2):
                                    if (_mutate_item(self.state, (4606 + entityId), -1, False) <= 0):
                                        self.state[41] = 9
                                        self.state[StateSlot.StageScrollSpeed] = 2
                                        self.state[StateSlot.StageScriptAdvancePerTick] = 1
                                        self.removeEntity(entityId)
                                    if (self.state[22] == 0):
                                        self.renderQueue.enqueue(3, 0, 0, 0, self.state[(4606 + entityId)], 0)
                            else:
                                self.state[StateSlot.VisualStageScrollX] = (self.state[StateSlot.VisualStageScrollX] + 2)
                                if (self.state[22] == 0):
                                    for var3 in range(0, 5):
                                        self.drawSpriteRegion(gfx, 4, 299, 0, toRenderPixels(((((int_div(((entityY - GAME_VIEW_WIDTH)), 48)) * 48) - ((self.state[StateSlot.VisualStageScrollX] % 48))) + (var3 * 48))), 20)
                                        self.drawSpriteRegion(gfx, 4, 300, 132, toRenderPixels(((((int_div(((entityY - GAME_VIEW_WIDTH)), 48)) * 48) - ((self.state[StateSlot.VisualStageScrollX] % 48))) + (var3 * 48))), 20)
                                self.renderQueue.enqueue(0, 0, entityY, 6, 334, 196865)
                                self.renderQueue.enqueue(0, 48, entityY, 6, 334, 196865)
                                self.renderQueue.enqueue(0, 144, entityY, 6, 334, 196865)
                                self.renderQueue.enqueue(0, 192, entityY, 6, 334, 196865)
                                self.renderQueue.enqueue(0, 0, (entityY + 16), 6, 333, 196865)
                                self.renderQueue.enqueue(0, 48, (entityY + 16), 6, 333, 196865)
                                self.renderQueue.enqueue(0, 144, (entityY + 16), 6, 333, 196865)
                                self.renderQueue.enqueue(0, 192, (entityY + 16), 6, 333, 196865)
                                self.renderQueue.enqueue(0, 64, entityY, 7, 345, 131329)
                                self.renderQueue.enqueue(0, 144, entityY, 7, 346, 131329)
                                self.renderQueue.enqueue(0, 64, (entityY + 16), 7, 345, 131329)
                                self.renderQueue.enqueue(0, 144, (entityY + 16), 7, 346, 131329)
                                self.resolveEntityCollisions(entityId, 0, entityY, 96, 32)
                                self.resolveEntityCollisions(entityId, 144, entityY, 96, 32)
                                if (entityY <= (-48)):
                                    self.state[(EntityField.Parameter0 + entityId)] += 1
                                    self.state[StateSlot.CollisionMapScrollX] = 0
                                    self.state[StateSlot.VisualStageScrollX] = 0
                                    self.state[(4606 + entityId)] = 4
                                else:
                                    entityY -= 2
                    case _:
                        pass
            except _SwitchBreak:
                pass
            if (self.changedEntityCount == 0):
                self.state[(EntityField.X + entityId)] = (entityX + (self.state[StateSlot.StageScrollSpeed] * self.entityDirectionSign))
                self.state[(EntityField.Y + entityId)] = entityY
                self.state[(EntityField.Age + entityId)] = (age := age + (1))
            entityId = nextEntityId
    

GENERATOR_STATS = {"source":"browser-prototype-ts/src/game/direct/entities/AuxiliaryEntitySystem.ts","sourceSha256":"28f05ff8724d134133ab8abf0732a11cb7d485194d99fb167483f7c4427c457e","outputLines":563,"loweredSwitchFallthroughs":0,"unsupported":{}}
