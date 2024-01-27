import { Opts } from '../options-manager'
import { SoundManager } from '../sound-manager'

export class MovementSoundTweaker {
    constructor() {
        /* runs in prestart */
        function getSoundFromColl(coll: ig.CollEntry, type: keyof typeof sc.ACTOR_SOUND): sc.ACTOR_SOUND_BASE {
            var c = ig.terrain.getTerrain(coll, true, true),
                e = sc.ACTOR_SOUND[type] || sc.ACTOR_SOUND.none
            return (e as any)[c] ?? e[ig.TERRAIN_DEFAULT]
        }
        let lastStep: boolean = true
        sc.ActorEntity.inject({
            update() {
                /* copied from the game code */
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
                } else {
                    nav.failTimer = 0
                }

                ig.ActorEntity.prototype.update.call(this)

                if (!this.jumping && !this.animationFixed && this.stepFx.frames && !Vec2.isZero(this.coll.accelDir) && this.coll.relativeVel >= ig.ACTOR_RUN_THRESHOLD) {
                    const frame: number = this.animState.getFrame()
                    if (frame != this.stepFx.lastFrame) {
                        const sound = getSoundFromColl(this.coll, this.soundType)
                        let spawnFx = false
                        let vol: number | undefined
                        if (this.coll._collData?.collided && this == (ig.game.playerEntity as sc.ActorEntity)) {
                            const dist = Vec3.distance(Vec3.create(), this.coll.vel)
                            vol = dist.map(40, 180, 1, 0.4)
                            if (dist > 170) {
                                const minDist = Math.min(
                                    Vec2.distance(Vec2.createC(0, 1), this.coll._collData.blockDir),
                                    Vec2.distance(Vec2.createC(0, -1), this.coll._collData.blockDir),
                                    Vec2.distance(Vec2.createC(1, 0), this.coll._collData.blockDir),
                                    Vec2.distance(Vec2.createC(-1, 0), this.coll._collData.blockDir)
                                )
                                /* check if the player is going diagoally */
                                if (minDist > 0.5) {
                                    vol = 1
                                }
                            }
                            if (frame == 2) {
                                ig.SoundHelper.playAtEntity(
                                    new ig.Sound(lastStep ? SoundManager.sounds.hitOrganic1 : SoundManager.sounds.hitOrganic2, Opts.wallBumpVolume * vol),
                                    this,
                                    null,
                                    null,
                                    700
                                )
                            } else if (frame == 5) {
                                ig.SoundHelper.playAtEntity(
                                    new ig.Sound(lastStep ? SoundManager.sounds.hitOrganic3 : SoundManager.sounds.hitOrganic4, Opts.wallBumpVolume * vol),
                                    this,
                                    null,
                                    null,
                                    700
                                )
                                lastStep = !lastStep
                            }
                        }
                        if (vol === undefined || vol < 0.6) {
                            if (frame == this.stepFx.frames[0]) {
                                spawnFx = true
                                ig.SoundHelper.playAtEntity(SoundManager.muliplySoundVol(sound.step1!, Opts.footstepVolume as number), this, null, null, 700)
                                this.onMoveEffect && this.onMoveEffect('step')
                            }
                            if (frame == this.stepFx.frames[1]) {
                                spawnFx = true
                                ig.SoundHelper.playAtEntity(SoundManager.muliplySoundVol(sound.step2!, Opts.footstepVolume as number), this, null, null, 700)
                                this.onMoveEffect && this.onMoveEffect('step')
                            }
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
                } else {
                    this.stepFx.lastFrame = -1
                }
            },
            onJump(addedHeight, ignoreSounds) {
                this.parent(addedHeight, true)
                if (!ignoreSounds) {
                    const soundObj1 = sc.ACTOR_SOUND[this.soundType] || sc.ACTOR_SOUND.none
                    const soundObj2 = (soundObj1 as any)[ig.terrain.getTerrain(this.coll, true, true)] || soundObj1[ig.TERRAIN_DEFAULT]
                    if (soundObj2?.jump) ig.SoundHelper.playAtEntity(SoundManager.muliplySoundVol(soundObj2.jump, Opts.jumpVolume), this, null, null, 700)
                }
            },
        })

        /* dash sound multiplier */
        ig.ACTION_STEP.PLAY_SOUND.inject({
            init(settings) {
                this.parent(settings)
                this.origVolume = this.sound.volume
            },
            start(target) {
                if (this.sound.webAudioBuffer.path == 'media/sound/battle/dash-3.ogg') {
                    this.sound.volume = this.origVolume * Opts.dashVoulme
                }
                this.parent(target)
            },
        })
    }
}
