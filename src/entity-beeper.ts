import { MenuOptions } from "./options"
import { SoundManager } from "./sound-manager"

export class EntityBeeper {
    minRadius: number = 12*16

    constructor() { /* in prestart */
        const sound = new ig.Sound(SoundManager.sounds.entity, 0.8)
        ig.ENTITY.Enemy.inject({
            playAtSoundHandle: null,
            show() {
                if (MenuOptions.loudEntitiesEnabled) {
                    this.playAtSoundHandle = ig.SoundHelper.playAtEntity(sound, this, true, {
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
    }
}
