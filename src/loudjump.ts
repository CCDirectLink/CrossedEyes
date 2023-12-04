import { SoundManager, isHandleOff, turnOffHandle } from './sound-manager'

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
        systemClock: ig.system.clock.last
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
        g = coll.level,
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

function tpBackToPlayer(e: ig.Entity) {
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
                    this.stopRunning(); return
                }
                if (!this.jumping && !isFallingOrJumping(this)) {
                    if (ig.CollTools.hasWallCollide(this.coll, 1)) {
                        this.rfcr.collided = true
                        // this.stopRunning(); return
                    }
                    if (ig.Timer.time - this.rfc.startTime > this.rfc.timer) {
                        this.stopRunning(); return
                    }
                }
                if (ig.Timer.time - this.rfc.startTime > 15) { this.stopRunning(); return }
            }
        },
        checkQuickRespawn() {
            if (this.coll.pos.z < ig.game.minLevelZ && !this.coll.ignoreCollision && this.coll._collData) {
                const e = ig.EntityTools.getGroundEntity(this)
                if (!e || !(e instanceof ig.ENTITY.Elevator)) {
                    this.rfcr.fallType = ig.TERRAIN.HOLE
                    this.stopRunning(); return
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
                timer: seconds
            }
            this.rfcr = { pos: Vec3.create() }

            tpBackToPlayer(this)

            this.coll.ignoreCollision = false
            Vec2.assign(this.coll.accelDir, this.face)
            this.coll.maxVel = ig.game.playerEntity.coll.maxVel * vel

            const save = saveTickData()

            const now = Date.now()
            ig.Timer._last = now
            for (let i = 0; this.rfc.on; i++) {
                advanceTime(now, i * (1000 / fps))

                this.coll.updated = 0 /* trick the game to think the entitiy was not just updated */
                ig.game.physics.updateCollEntry(this.coll, [])
            }

            restoreTickData(save)
            // const time = ig.Timer.time - orig.timerTimer
            // console.log(`Tracking done, Time spend: ${time}`)

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
                // this.coll.relativeVel = 0
                this.coll.ignoreCollision = true
                tpBackToPlayer(this)
            }
        },
    })
}

enum TrackType {
    Water,
    Hole,
    LowerLevel,
    HigherLevel,
    Land,
    None,
}


export class LoudJump {
    predictor!: sc.CrossedEyesPositionPredictor
    lastTrack: number = 0
    trackInterval: number = 0.1e3
    paused: boolean = false

    trackConfigs: {
        vel: number
        time: number
    }[] = [ /* travel the same distance but with different speed */
            { vel: 0.7, time: 0.4285714285714286 },
            { vel: 0.8, time: 0.375 },
            { vel: 1, time: 0.3 },
        ]

    checkDegrees: number[] = [ /* relative to player facing */
        // 0,
        // 22.5, -22.5,
        // 67.5, -67.5,
        // 90, -90,
        // 112.5, -112.5,
        // 135, -135,
        // 157.5, -157.5,
        // 180,
        0,
        45, -45,
        90, -90,
        135, -135,
        180
    ]

    dirHandles: { handle: ig.SoundHandleWebAudio, sound: string }[] = []
    soundRange: number = 16 * 16

    constructor() { /* in prestart */
        const self = this
        initCrossedEyesPositionPredictor()
        ig.Game.inject({
            loadingComplete() {
                this.parent()
                const pos: Vec3 = ig.game.playerEntity.coll.pos
                self.predictor = ig.game.spawnEntity(sc.CrossedEyesPositionPredictor, pos.x, pos.y, pos.z, {})
            }
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                self.handle()
            },
        })
    }

    pause() { this.paused = true }
    resume() { this.paused = false }

    handle() {
        const p: ig.ENTITY.Player = ig.game.playerEntity
        if (this.paused || ig.game.events.blockingEventCall || !this.predictor || !p || !p.coll?.pos || isFallingOrJumping(p)) {
            this.dirHandles.forEach(o => o && turnOffHandle(o.handle, this.soundRange))
            return
        }

        if (ig.game.now - this.lastTrack > this.trackInterval) {
            this.lastTrack = ig.game.now

            for (let i = 0; i < this.checkDegrees.length; i++) {
                const deg = this.checkDegrees[i]
                let face: Vec2 = Vec2.create()
                Vec2.rotate(ig.game.playerEntity.face, (deg * Math.PI) / 180, face)
                const out = this.getTypeByTracking(face)
                this.playRes(i, out.res, out.type)
            }
        }
    }

    playRes(i: number, res: PlayerTraceResult, type: TrackType) {
        // console.log(TrackType[type])
        let { handle, sound } = this.dirHandles[i] ?? { handle: undefined, sound: undefined }
        if (type == TrackType.None) {
            if (handle && !isHandleOff(handle)) { turnOffHandle(handle, this.soundRange) }
            return
        }
        let soundName: string = ''
        let volume: number = 1
        switch (type) {
            case TrackType.Water: soundName = SoundManager.sounds.water; break
            case TrackType.Hole: soundName = SoundManager.sounds.hole; break
            case TrackType.LowerLevel: soundName = SoundManager.sounds.lower; volume = 1.5; break
            case TrackType.HigherLevel: soundName = SoundManager.sounds.higher; break
            case TrackType.Land: soundName = SoundManager.sounds.land; break
        }

        if (soundName) {
            if (soundName && (!handle || !handle._playing || sound != soundName)) {
                if (handle && handle._playing) { handle.stop() }
                this.dirHandles[i] = {
                    handle: new ig.Sound(soundName, volume).play(true, {
                        speed: 1,
                    }),
                    sound: soundName,
                }
                handle = this.dirHandles[i].handle
                turnOffHandle(handle, this.soundRange)
            }
            const pos: Vec3 = res.pos
            if (!handle.pos || !Vec3.equal(handle.pos.point3d, pos)) {
                handle.setFixPosition(pos, this.soundRange)
            }
        }
    }

    getTypeByTracking(face: Vec2): { res: PlayerTraceResult, type: TrackType } {
        const results: { res: PlayerTraceResult, type: TrackType }[] = []

        for (const config of this.trackConfigs) {
            this.predictor.face = Vec2.create(face)
            const res: PlayerTraceResult = this.predictor.runPlayerTrace(config.time, config.vel)
            const type: TrackType = this.getTypeFromRes(res)
            const obj = { res, type }
            // console.log(res.pos.x, res.pos.y, res.pos.z, 'coll', !!res.collided, 'edge:', !!res.touchedEdge, 'j:', !!res.jumped, 'l:', !!res.jumpLanded, 'fallType:', res.fallType)
            if (type == TrackType.Land) { return obj }
            results.push(obj)
        }
        for (const res of results) { if (res.type == TrackType.HigherLevel) { return res } }
        for (const res of results) { if (res.type == TrackType.LowerLevel) { return res } }
        return results[0]
    }


    getTypeFromRes(res: PlayerTraceResult): TrackType {
        if (res.jumped) {
            if (res.fallType !== undefined) {
                if (res.fallType == ig.TERRAIN.HOLE || res.fallType == ig.TERRAIN.HIGHWAY) { return TrackType.Hole }
                if (res.fallType == ig.TERRAIN.WATER) { return TrackType.Water }
            } else if (res.jumpLanded) {
                const diff = ig.game.playerEntity.coll.pos.z - res.pos.z
                console.log(diff)
                if (diff > 8) { return TrackType.LowerLevel }
                else if (diff < -8) { return TrackType.HigherLevel }
                return TrackType.Land
            }
        }
        return TrackType.None
    }
}
