import { MenuOptions } from '../options'
import CrossedEyes, { PauseListener } from '../plugin'
import { SoundManager } from '../sound-manager'

function getSoundName(e: ig.Entity): string | undefined {
    if (e instanceof ig.ENTITY.Enemy ||
        e instanceof ig.ENTITY.MultiHitSwitch ||
        e instanceof ig.ENTITY.Switch ||
        e instanceof ig.ENTITY.OneTimeSwitch ||
        e instanceof ig.ENTITY.Destructible) {
        return SoundManager.sounds.entity
    }
    if (e instanceof ig.ENTITY.Door ||
        e instanceof ig.ENTITY.TeleportField ||
        e instanceof ig.ENTITY.TeleportGround) {

        return SoundManager.sounds.tpr
    }
}

function playAt(e: ig.Entity) {
    const soundName = getSoundName(e)
    if (soundName) {
        e.playAtSoundHandle = ig.SoundHelper.playAtEntity(new ig.Sound(soundName, 0.8), e, true, {
            fadeDuration: 0
        }, 16 * 16)
    }
}

export class EntityBeeper implements PauseListener {
    constructor() { /* in prestart */
        CrossedEyes.pauseables.push(this)

        ig.Entity.inject({
            playAtSoundHandle: null,
            show(...args) {
                if (MenuOptions.loudEntitiesEnabled) {
                    playAt(this)
                }
                return this.parent(...args)
            },
            hide(...args) {
                this.parent(...args)
                this.playAtSoundHandle?.stop()
            },
            onKill(...args) {
                this.parent()
                this.playAtSoundHandle?.stop(...args)
            },
            update(...args) {
                this.parent(...args)
                if (this.playAtSoundHandle && !CrossedEyes.isPaused) {
                    if (this.playAtSoundHandle._nodeSource) {
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
                    if (this.playAtSoundHandle._playing) {
                        if (((this instanceof ig.ENTITY.MultiHitSwitch || this instanceof ig.ENTITY.OneTimeSwitch) && this.isOn) ||
                            ((this instanceof ig.ENTITY.Door) && (!this.active)) ||
                            ((this instanceof ig.ENTITY.TeleportField) && (!this.interactEntry))) {
                            this.playAtSoundHandle.stop()
                        }
                    } else {
                        if (this instanceof ig.ENTITY.Door && this.active) { return }
                        playAt(this)
                    }
                }
            },
        })
    }
    pause(): void {
        ig.game.entities.forEach(e => e.playAtSoundHandle?.stop())
    }
}
