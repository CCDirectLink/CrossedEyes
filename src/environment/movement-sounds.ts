import { Opts } from '../options'
import { SoundManager } from '../sound-manager'
declare global {
    namespace ig {
        namespace ACTION_STEP {
            interface PLAY_SOUND {
                origVolume: number
            }
        }
    }
}

/* prestart */
function getSoundFromColl(coll: ig.CollEntry, type: keyof typeof sc.ACTOR_SOUND): sc.ACTOR_SOUND_BASE {
    var c = ig.terrain.getTerrain(coll, true, true),
        e = sc.ACTOR_SOUND[type] || sc.ACTOR_SOUND.none
    return (e as any)[c] ?? e[ig.TERRAIN_DEFAULT]
}
let lastCollStep: boolean = true

let stepCounter: number = 0
sc.ActorEntity.inject({
    update() {
        const player = this as unknown as ig.ENTITY.Player
        if (player !== ig.game.playerEntity) return this.parent()

        /* most copied from the game code */
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

        if (!this.stepFx.frames) this.stepFx.frames = [2, 5]
        if (!this.jumping && !this.animationFixed && this.stepFx.frames && !Vec2.isZero(this.coll.accelDir)) {
            const frame: number = this.animState.getFrame()
            if (frame != this.stepFx.lastFrame) {
                stepCounter = (stepCounter + 1) % 6
                /* reset stepCounter when frame is reset (sync stepCounter with frame) */
                if (
                    frame == 0 &&
                    this.animState.animations &&
                    this.animState.animations[0] &&
                    this.stepFx.lastFrame != this.animState.animations[0].getFrameCount() - 1
                ) {
                    stepCounter = 0
                }

                const sound = getSoundFromColl(this.coll, this.soundType)
                let spawnFx = false
                let collVol: number | undefined
                if (this.coll._collData?.collided && this == (ig.game.playerEntity as sc.ActorEntity)) {
                    const dist = Vec3.distance(Vec3.create(), this.coll.vel)
                    collVol = dist.map(40, 180, 1, 0.4)
                    if (dist > 170) {
                        const minDist = Math.min(
                            Vec2.distance(Vec2.createC(0, 1), this.coll._collData.blockDir),
                            Vec2.distance(Vec2.createC(0, -1), this.coll._collData.blockDir),
                            Vec2.distance(Vec2.createC(1, 0), this.coll._collData.blockDir),
                            Vec2.distance(Vec2.createC(-1, 0), this.coll._collData.blockDir)
                        )
                        /* check if the player is going diagoally */
                        if (minDist > 0.5) {
                            collVol = 1
                        }
                    }
                    if (stepCounter == 2) {
                        ig.SoundHelper.playAtEntity(
                            new ig.Sound(lastCollStep ? SoundManager.sounds.hitOrganic1 : SoundManager.sounds.hitOrganic2, Opts.wallBumpVolume * collVol),
                            this,
                            null,
                            null,
                            700
                        )
                    } else if (stepCounter == 5) {
                        ig.SoundHelper.playAtEntity(
                            new ig.Sound(lastCollStep ? SoundManager.sounds.hitOrganic3 : SoundManager.sounds.hitOrganic4, Opts.wallBumpVolume * collVol),
                            this,
                            null,
                            null,
                            700
                        )
                        lastCollStep = !lastCollStep
                    }
                }

                let cliffSafeguardVol: number = 0
                let cliffSafeguardPos: Vec2 | undefined
                if (player.crossedeyes_cliffSafeguardVelCancel && !Vec2.isZero(player.crossedeyes_cliffSafeguardVelCancel)) {
                    const accelDir = Vec2.create(player.coll.accelDir)

                    const velCancel = Vec2.create(player.crossedeyes_cliffSafeguardVelCancel)
                    Vec2.divC(velCancel, 3)

                    let dot = Math.abs(Vec2.dot(velCancel, accelDir))
                    if (Math.abs(velCancel.x) > 0 && Math.abs(velCancel.y) > 0) {
                        dot *= 1.5
                    }

                    cliffSafeguardVol = dot.limit(0, 1).round(2)
                    cliffSafeguardPos = Vec2.create(velCancel)
                }

                if (cliffSafeguardVol > 0) {
                    const vol = (cliffSafeguardVol + 0.2) * Opts.cliffSafeguardVolume
                    const pos = Vec2.sub(Vec3.create(player.coll.pos), Vec2.mulC(cliffSafeguardPos!, 16 * 5)) as Vec3

                    if (stepCounter == 0) {
                        SoundManager.playSound('cliffSafeguard1', 1, vol, pos)
                    }
                    if (stepCounter == 3) {
                        SoundManager.playSound('cliffSafeguard2', 1, vol, pos)
                    }
                }

                if (cliffSafeguardVol != 1 && (collVol === undefined || collVol < 0.6)) {
                    const vol = cliffSafeguardVol.map(0.7, 1, 1, 0.3).limit(0, 1) * Opts.footstepVolume
                    if (stepCounter == 2) {
                        spawnFx = true
                        ig.SoundHelper.playAtEntity(SoundManager.muliplySoundVol(sound.step1!, vol), this, null, null, 700)
                        this.onMoveEffect && this.onMoveEffect('step')
                    }
                    if (stepCounter == 5) {
                        spawnFx = true
                        ig.SoundHelper.playAtEntity(SoundManager.muliplySoundVol(sound.step2!, vol), this, null, null, 700)
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
