import { MenuOptions } from "./options"
import { SoundManager } from "./sound-manager"

function angleBetweenPlayerAndObject(playerPosition: Vec2, objectPosition: Vec2, playerRotation: Vec2): number {
    const playerToObj = { x: objectPosition.x - playerPosition.x, y: objectPosition.y - playerPosition.y }
    const playerDirection = playerRotation

    const angle = Math.atan2(playerToObj.y, playerToObj.x) - Math.atan2(playerDirection.y, playerDirection.x)
    const degrees = (angle * 180) / Math.PI

    return Math.abs((degrees + 360) % 360)
}

function relativePositionFromAngle(angle: number): 'facing' | 'left' | 'right' | 'behind' {
    if (angle <= 45 || angle >= 315) {
        return 'facing'
    } else if (angle > 45 && angle <= 135) {
        return 'right'
    } else if (angle > 135 && angle <= 225) {
        return 'behind'
    } else if (angle > 225 && angle < 315) {
        return 'left'
    } else { throw new Error() }
}

export function getRelativePlayerToObjectPosition(objectPosition: Vec2) : 'facing' | 'left' | 'right' | 'behind' {
    const angle = angleBetweenPlayerAndObject(Vec2.create(ig.game.playerEntity.coll.pos), objectPosition, Vec2.create(ig.game.playerEntity.face))
    return relativePositionFromAngle(angle)
}

export class EntityBeeper {
    minRadius: number = 12*16

    constructor() { /* in prestart */
        const self = this

        const wallHum = new ig.Sound(SoundManager.sounds.wallHum, 1)
        ig.ENTITY.Enemy.inject({
            playAtSoundHandle: null,
            show() {
                if (MenuOptions.loudEntitiesEnabled) {
                    this.playAtSoundHandle = ig.SoundHelper.playAtEntity(wallHum, this, true, {
                        fadeDuration: 0
                    }, 16 * 16)
                }
                return this.parent()
            },
            hide() {
                this.parent()
                this.playAtSoundHandle?.stop()
            },
            onKill() {
                this.parent()
                this.playAtSoundHandle?.stop()
            },
            update() {
                this.parent()
                if (this.playAtSoundHandle?._nodeSource) {
                    const pFaceAngle: number = Vec2.clockangle(ig.game.playerEntity.face) * 180 / Math.PI
                    const diffPos: Vec2 = Vec2.create(ig.game.playerEntity.coll.pos)
                    Vec2.sub(diffPos, this.coll.pos)
                    const diffAngle: number = Vec2.clockangle(diffPos) * 180 / Math.PI

                    const angleDist: number = Math.min(
                        Math.abs(pFaceAngle - diffAngle),
                        360 - Math.abs(pFaceAngle - diffAngle)
                    )
                    this.playAtSoundHandle._nodeSource.bufferNode.playbackRate.value = angleDist < 40 ? 0.75 : 1
                }
            },
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                self.handleEnemies()
            },
        })
    }

    handleEnemies() {
        const ppos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
        const enemies: ig.ENTITY.Enemy[] = ig.game.getEntitiesByType(ig.ENTITY.Enemy)
            .filter(e => Vec3.distance(ppos, e.coll.pos) <= this.minRadius)

        for (const enemy of enemies) {
            const dir = getRelativePlayerToObjectPosition(enemy.coll.pos)
            if (dir) {}
        }
    }
}
