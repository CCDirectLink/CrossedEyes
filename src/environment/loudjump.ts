import { AimAnalyzer, isAiming } from '../hint-system/aim-analyze'
import { ObjectValues } from '../plugin'
import { SoundManager } from '../sound-manager'
import CrossedEyes from '../plugin'
import { Opts } from '../options'

declare global {
    namespace sc {
        interface CrossedEyesPositionPredictor extends ig.ActorEntity {
            rfc: {
                on: boolean
                timer: number
                startTime: number
            }
            rfcr: PlayerTraceResult

            runPlayerTrace(this: this, seconds: number, vel: number, fps?: number): PlayerTraceResult
            stopRunning(this: this): void
            checkQuickRespawn(this: this): void
        }
        interface CrossedEyesPositionPredictorConstructor extends ImpactClass<CrossedEyesPositionPredictor> {
            new (x: number, y: number, z: number, settings: ig.Entity.Settings): CrossedEyesPositionPredictor
        }
        var CrossedEyesPositionPredictor: CrossedEyesPositionPredictorConstructor
    }
}

interface TickData {
    timerTimer: number
    timerLast: number
    rawTick: number
    tick: number
    systemClock: number
}

function saveTickData(): TickData {
    return {
        timerTimer: ig.Timer.time,
        timerLast: ig.Timer._last,
        rawTick: ig.system.rawTick,
        tick: ig.system.tick,
        systemClock: ig.system.clock.last,
    }
}

function restoreTickData(data: TickData) {
    ig.Timer.time = data.timerTimer
    ig.Timer._last = data.timerLast
    ig.system.rawTick = ig.system.actualTick = data.rawTick
    ig.system.tick = data.tick
    ig.system.clock.last = data.systemClock
}

function advanceTime(start: number, add: number) {
    const delayed = Math.floor(start + add)
    ig.Timer.time = ig.Timer.time + Math.min((delayed - ig.Timer._last) / 1e3, ig.Timer.maxStep) * ig.Timer.timeScale
    ig.Timer._last = delayed
    ig.system.rawTick = ig.system.actualTick = Math.min(ig.Timer.maxStep, ig.system.clock.tick()) * ig.system.totalTimeFactor
    ig.system.tick = ig.system.actualTick * ig.system.timeFactor
}

export function isFallingOrJumping(e: ig.ActorEntity) {
    return e.jumping || isFallTerrainOrHole(getTerrainButDefIsHole(e.coll, true))
}

export interface PlayerTraceResult {
    pos: Vec3
    collided?: boolean
    touchedEdge?: boolean
    jumped?: boolean
    jumpLanded?: boolean
    fallType?: ig.TERRAIN
}

function getTerrainButDefIsHole(coll: ig.CollEntry, precise?: boolean, andBelow?: boolean) {
    if (!coll) return 0
    let b: Vec2 = Vec2.create()
    var e = coll.getCenter(b)
    if (coll._collData && coll._collData.groundEntry && coll._collData.groundEntry.entity.terrain) return coll._collData.groundEntry.entity.terrain
    var f = 0,
        g = parseInt(coll.level),
        h = ig.game.getLevelHeight(g)
    do {
        f = ig.game.getLevelHeight(g)
        f = ig.terrain.getMapTerrain(e.x, e.y + f - h, g, precise ? coll.size.x : 0, precise ? coll.size.y : 0)
        g--
    } while (andBelow && !f && g >= 0)
    return f || ig.TERRAIN.HOLE /* <- the only change here */
}

function isFallTerrainOrHole(terrain: ig.TERRAIN) {
    return ig.terrain.isFallTerrain(terrain) || terrain == ig.TERRAIN.HOLE
}

function tpBackToPlayer(e: ig.ActorEntity) {
    const p = ig.game.playerEntity
    const npos = p.coll.pos
    e.setPos(npos.x, npos.y, npos.z, false)
    e.coll.level = p.coll.level

    Vec2.assignC(e.coll.accelDir, 0, 0)
    Vec2.assignC(e.coll.vel, 0, 0)

    e.coll.totalBlockTimer = 0
    e.coll.partlyBlockTimer = 0
}

function initCrossedEyesPositionPredictor() {
    sc.CrossedEyesPositionPredictor = ig.ActorEntity.extend({
        rfc: { on: false, startTime: 0, timer: 0 },
        init(x: number, y: number, z: number, settings: ig.Entity.Settings) {
            this.parent(x, y, z, settings)
            this.setDefaultConfig(ig.game.playerEntity.configs.normal)
            this.coll.setSize(16, 16, 24)
            this.coll.ignoreCollision = true

            // this.animSheet = sc.party.getPartyMemberModel('Emilie').animSheet
            // this.initAnimations()
        },
        update() {
            this.parent()
            this.rfc.on && this.checkQuickRespawn()
            if (this.rfc.on) {
                if (ig.CollTools.isPostMoveOverHole(this.coll, true)) {
                    this.rfcr.touchedEdge = true
                }
                if (this.jumping) {
                    this.rfcr.jumped = true
                } else if (this.rfcr.jumped && !isFallingOrJumping(this)) {
                    this.rfcr.jumpLanded = true
                    this.stopRunning()
                    return
                }
                if (!this.jumping && !isFallingOrJumping(this)) {
                    if (ig.CollTools.hasWallCollide(this.coll, 1)) {
                        this.rfcr.collided = true
                    }
                    if (ig.Timer.time - this.rfc.startTime > this.rfc.timer) {
                        this.stopRunning()
                        return
                    }
                }
                if (ig.Timer.time - this.rfc.startTime > 5) {
                    this.stopRunning()
                    return
                }
            }
        },
        checkQuickRespawn() {
            if (this.coll.pos.z < ig.game.minLevelZ && !this.coll.ignoreCollision && this.coll._collData) {
                const e = ig.EntityTools.getGroundEntity(this)
                if (!e || !(e instanceof ig.ENTITY.Elevator)) {
                    this.rfcr.fallType = ig.TERRAIN.HOLE
                    this.stopRunning()
                    return
                }
            }
            if (!(this.coll.pos.z > this.coll.baseZPos || this.jumping || this.coll.zGravityFactor == 0)) {
                const terrain = ig.terrain.getTerrain(this.coll, true)
                if (ig.terrain.isFallTerrain(terrain)) {
                    this.rfcr.fallType = terrain
                    this.stopRunning()
                    return
                }
            }
        },
        runPlayerTrace(seconds: number, vel: number, fps: number = 30): PlayerTraceResult {
            this.rfc = {
                on: true,
                startTime: ig.Timer.time,
                timer: seconds,
            }
            this.rfcr = { pos: Vec3.create() }

            tpBackToPlayer(this)
            const p = ig.game.playerEntity
            this.jumping = p.jumping
            this.coll.vel = Vec3.create(p.coll.vel)

            this.coll.ignoreCollision = false

            Vec2.assign(this.coll.accelDir, Vec2.normalize(this.face))
            this.coll.maxVel = p.coll.maxVel * vel

            const save = saveTickData()

            const now = Date.now()
            ig.Timer._last = now
            for (let i = 0; this.rfc.on; i++) {
                advanceTime(now, i * (1000 / fps))

                this.coll.updated = 0 /* trick the game to think the entitiy was not just updated */
                ig.game.physics.updateCollEntry(this.coll, [])
            }

            restoreTickData(save)

            this.stopRunning()
            return this.rfcr
        },
        stopRunning() {
            if (this.rfc.on) {
                this.rfc.on = false
                this.coll._killed = false

                this.rfcr.pos = Vec3.create(this.coll.pos)
                Vec2.assignC(this.coll.accelDir, 0, 0)
                Vec2.assignC(this.coll.vel, 0, 0)
                this.coll.ignoreCollision = true
                tpBackToPlayer(this)
            }
        },
    })
}

const TRACK_TYPE = {
    Water: 0,
    Hole: 1,
    LowerLevel: 2,
    HigherLevel: 3,
    Land: 4,
    None: 5,
} as const
type TrackType = ObjectValues<typeof TRACK_TYPE>

export class LoudJump {
    predictor!: sc.CrossedEyesPositionPredictor
    lastTrack: number = 0
    trackInterval: number = 0.1e3

    static get continiousConfig(): SoundManager.ContiniousSettings {
        return {
            paths: ['water', 'hole', 'lower', 'higher', 'land'],
            changePitchWhenBehind: true,
            pathsBehind: ['waterLP', 'holeLP', 'lowerLP', 'higherLP', 'landLP'],
            getVolume: () => Opts.jumpHintsVolume * (AimAnalyzer.g.aimAnalyzeOn && isAiming() ? 0.4 : 1),
            condition: () => !(isAiming() && AimAnalyzer.g.wallScanOn),
        }
    }

    trackConfigs: {
        vel: number
        time: number
    }[] = [
        /* travel the same distance but with different speed */
        { vel: 0.7, time: 0.4285714285714286 },
        { vel: 0.8, time: 0.375 },
        { vel: 1, time: 0.3 },
    ] as const

    static checkDegrees: number[] = [
        /* relative to player facing */
        // 0, 22.5, -22.5, 67.5, -67.5, 90, -90, 112.5, -112.5, 135, -135, 157.5, -157.5, 180,
        0, 45, -45, 90, -90, 135, -135, 180,
    ] as const

    constructor() {
        /* in prestart */
        for (const deg of LoudJump.checkDegrees) {
            SoundManager.continious[this.getId(deg)] = LoudJump.continiousConfig
        }

        const self = this
        initCrossedEyesPositionPredictor()
        ig.Game.inject({
            loadingComplete() {
                this.parent()
                const pos: Vec3 = ig.game.playerEntity.coll.pos
                self.predictor = ig.game.spawnEntity(sc.CrossedEyesPositionPredictor, pos.x, pos.y, pos.z, {})

                for (const level of Object.values(ig.game.levels)) {
                    for (const map of level.maps ?? []) {
                        if ('tilesetName' in map) {
                            if (ig.terrain.tilesetIds[map.tilesetName as string] === undefined) {
                                ig.terrain.tilesetIds[map.tilesetName as string] = new Array(2048).fill(2)
                            }
                        }
                    }
                }
            },
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                self.handle()
            },
        })

        ig.ENTITY.JumpPanelFar?.inject({
            /* fix launch pad going crazy by removing the animations */
            onTopEntityJumpFar(entity: ig.ENTITY.Combatant) {
                if (self.predictor && self.predictor.rfc.on) {
                    if (!this.condition.evaluate() && entity.party == sc.COMBATANT_PARTY.PLAYER) return false
                    Vec2.assign(entity.coll.vel, this.panelType.dir)
                    Vec2.length(entity.coll.vel, this.jumpDistance.speed)
                    Vec2.assign(entity.coll.accelDir, this.panelType.dir)
                    Vec2.assign(entity.face, this.panelType.dir)
                    entity.coll.float.height
                        ? entity.doFloatJump(10, this.jumpDistance.effectDuration + 0.1, this.jumpDistance.speed)
                        : entity.doJump(this.jumpDistance.zVel, this.jumpDistance.height, this.jumpDistance.speed, 0, false)
                    entity.coll.friction.air = 0
                    return true
                } else {
                    return this.parent(entity)
                }
            },
        })
    }

    private getId(deg: number) {
        return `jump_${deg}`
    }

    handle() {
        const p: ig.ENTITY.Player = ig.game.playerEntity
        if (!Opts.spacialAudio || !Opts.loudWalls || CrossedEyes.isPaused || ig.game.playerEntity?.floating || !this.predictor || !p || !p.coll?.pos) {
            return
        }
        if (ig.game.now - this.lastTrack > this.trackInterval) {
            this.lastTrack = ig.game.now

            for (const deg of LoudJump.checkDegrees) {
                let dir: Vec2 = Vec2.rotate(Vec2.create(ig.game.playerEntity.face), (deg * Math.PI) / 180)
                const out = this.getTypeByTracking(dir)
                this.playRes(this.getId(deg), dir, out.res, out.type)
            }
        }
    }

    playRes(id: string, dir: Vec2, res: PlayerTraceResult, type: TrackType) {
        if (type == TRACK_TYPE.None) {
            SoundManager.stopContinious(id)
            return
        }

        const range: number = 16 * 16
        SoundManager.handleContiniousEntry(id, res.pos, range, type, dir)
    }

    getTypeByTracking(face: Vec2): { res: PlayerTraceResult; type: TrackType } {
        const results: { res: PlayerTraceResult; type: TrackType }[] = []

        for (const config of this.trackConfigs) {
            this.predictor.face = Vec2.create(face)
            const res: PlayerTraceResult = this.predictor.runPlayerTrace(config.time, config.vel)
            const type: TrackType = this.getTypeFromRes(res)
            const obj = { res, type }
            if (type == TRACK_TYPE.Land) {
                return obj
            }
            results.push(obj)
        }
        for (const res of results) {
            if (res.type == TRACK_TYPE.HigherLevel) {
                return res
            }
        }
        for (const res of results) {
            if (res.type == TRACK_TYPE.LowerLevel) {
                return res
            }
        }
        return results[0]
    }

    getTypeFromRes(res: PlayerTraceResult): TrackType {
        if (res.jumped && res.fallType !== undefined) {
            if (res.fallType == ig.TERRAIN.HOLE || res.fallType == ig.TERRAIN.HIGHWAY) {
                return TRACK_TYPE.Hole
            }
            if (res.fallType == ig.TERRAIN.WATER) {
                return TRACK_TYPE.Water
            }
        }
        const diff = ig.game.playerEntity.coll.pos.z - res.pos.z
        if (diff > 6) {
            return TRACK_TYPE.LowerLevel
        } else if (diff < -6) {
            return TRACK_TYPE.HigherLevel
        }
        if (res.jumped) {
            if (res.fallType === undefined) {
                if (res.jumpLanded) {
                    return TRACK_TYPE.Land
                }
            }
        }
        return TRACK_TYPE.None
    }
}
