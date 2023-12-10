import { MenuOptions } from '../options'
import { mulSoundVol } from '../sound-manager'

export function tweakFootsteps() { /* runs in prestart */

    function getSoundFromColl(coll: ig.CollEntry, type: keyof typeof sc.ACTOR_SOUND): sc.ACTOR_SOUND_BASE {
        var c = ig.terrain.getTerrain(coll, true, true),
            e = sc.ACTOR_SOUND[type] || sc.ACTOR_SOUND.none
        return (e as any)[c] ?? e[ig.TERRAIN_DEFAULT]
    }
    sc.ActorEntity.inject({
        update() { /* copied from the game code */
            this.stepStats.terrain = ig.terrain.getTerrain(this.coll, true)
            this.stepStats.centerTerrain = ig.terrain.getTerrain(this.coll, false)
            if (this.stepFx.prevEffect && this.stepFx.prevTerrain != this.stepStats.terrain) {
                this.stepFx.prevEffect.stop()
                this.stepFx.prevEffect = null
            }
            this.onTerrainUpdate()
            this.influencer.onUpdate()
            const nav = this.nav
            if (nav.path.failCount) {
                nav.failTimer = nav.failTimer + ig.system.tick
                if (nav.path.failCount != nav.lastFailCount) {
                    nav.lastFailCount = nav.path.failCount
                    this.onNavigationFailed(nav.failTimer)
                }
            } else { nav.failTimer = 0 }

            ig.ActorEntity.prototype.update.call(this)

            if (!this.jumping && !this.animationFixed && this.stepFx.frames &&
                !Vec2.isZero(this.coll.accelDir) && this.coll.relativeVel >= ig.ACTOR_RUN_THRESHOLD) {

                const frame: number = this.animState.getFrame()
                if (frame != this.stepFx.lastFrame) {
                    const sound = getSoundFromColl(this.coll, this.soundType)
                    let spawnFx = false
                    if (frame == this.stepFx.frames[0]) {
                        spawnFx = true
                        ig.SoundHelper.playAtEntity(mulSoundVol(sound.step1!, MenuOptions.footstepVolume), this, null, null, 700)
                        this.onMoveEffect && this.onMoveEffect('step')
                    }
                    if (frame == this.stepFx.frames[1]) {
                        spawnFx = true
                        ig.SoundHelper.playAtEntity(mulSoundVol(sound.step2!, MenuOptions.footstepVolume), this, null, null, 700)
                        this.onMoveEffect && this.onMoveEffect('step')
                    }
                    if (spawnFx && sound.stepFx && !ig.CollTools.isPostMoveOverHole(this.coll, true)) {
                        const effect = this.stepFx.effects.spawnOnTarget(sound.stepFx, this, sound.stepFaceAlign ? { rotateFace: -1 } : null)
                        if (sound.cancelOnChange) {
                            this.stepFx.prevEffect = effect
                            this.stepFx.prevTerrain = this.stepStats.terrain
                        }
                    }
                    this.stepFx.lastFrame = frame
                }
            } else { this.stepFx.lastFrame = -1 }
        },
    })
}
