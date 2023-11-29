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
                if (ig.CollTools.hasWallCollide(this.coll, 1)) {
                    this.rfcr.collided = true
                    this.stopRunning(); return
                }
                if (ig.CollTools.isPostMoveOverHole(this.coll, true)) {
                    this.rfcr.touchedEdge = true
                }
                if (this.jumping) {
                    this.rfcr.jumped = true
                } else if (this.rfcr.jumped) {
                    this.rfcr.jumpLanded = true
                    this.stopRunning(); return
                }
                if (!this.jumping && !isFallTerrainOrHole(getTerrainButDefIsHole(this.coll, true)) && 
                    ig.Timer.time - this.rfc.startTime > this.rfc.timer) {

                    this.stopRunning(); return
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
                timer: seconds
            }
            this.rfcr = { pos: Vec3.create() }

            const npos = ig.game.playerEntity.coll.pos
            this.setPos(npos.x, npos.y, npos.z, false)

            this.coll.ignoreCollision = false
            const speed: Vec2 = Vec2.create(this.face)
            Vec2.mulC(speed, vel)
            Vec2.assign(this.coll.accelDir, speed)

            const save = saveTickData()

            const now = Date.now()
            ig.Timer._last = now
            for (let i = 0; this.rfc.on; i++) {
                advanceTime(now, i * (1000 / fps))

                this.coll.updated = 0 /* trick the game to think the entitiy was not just updated */
                ig.game.physics.updateCollEntry(this.coll, [])
            }
            this.rfcr.pos = Vec3.create(this.coll.pos)

            restoreTickData(save)
            // const time = ig.Timer.time - orig.timerTimer
            // console.log(`Tracking done, Time spend: ${time}`)

            this.stopRunning()
            this.setPos(npos.x, npos.y, npos.z, true)
            return this.rfcr
        },
        stopRunning() {
            this.rfc.on = false
            Vec2.assignC(this.coll.accelDir, 0, 0)
            Vec2.assignC(this.coll.vel, 0, 0)
            this.coll.ignoreCollision = true
        },
    })
}

export class LoudJump {
    predictor!: sc.CrossedEyesPositionPredictor
    lastTrack: number = 0
    trackInterval: number = 0.1e3
    paused: boolean = false

    trackConfigs: {
        vel: number
        time: number
        consider: (keyof PlayerTraceResult)[]
    }[] = [
            { vel: 1, time: 0.5, consider: ['fallType'], },
            // { vel: 1, time: 0.75, consider: ['fallType'], },
        ]

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
        if (this.paused || ig.game.events.blockingEventCall || !this.predictor || !p || !p.coll?.pos ||
            isFallTerrainOrHole(getTerrainButDefIsHole(ig.game.playerEntity.coll, true))) { return }

        if (ig.game.now - this.lastTrack > this.trackInterval) {
            this.lastTrack = ig.game.now

            const results: PlayerTraceResult[] = []

            for (const config of this.trackConfigs) {
                this.predictor.face = Vec2.create(p.face)
                const res: PlayerTraceResult = this.predictor.runPlayerTrace(config.time, config.vel)
                results.push(res)
                console.log(res.pos.x, res.pos.y, res.pos.z, 'coll', !!res.collided, 'edge:', !!res.touchedEdge, 'j:', !!res.jumped, 'l:', !!res.jumpLanded, 'fallType:', res.fallType)
            }
        }
    }
}
