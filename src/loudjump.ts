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
    fallenInWater?: boolean
    touchedEdge?: boolean
}

export class LoudJump {
    predictor!: sc.CrossedEyesPositionPredictor
    lastTrack: number = 0
    trackInterval: number = 0.1e3
    paused: boolean = false

    constructor() { /* in prestart */
        const self = this
        sc.CrossedEyesPositionPredictor = ig.ActorEntity.extend({
            rfc: { on: false, startTime: 0, timer: 0 },
            init(x: number, y: number, z: number, settings: ig.Entity.Settings) {
                this.parent(x, y, z, settings)
                this.setDefaultConfig(ig.game.playerEntity.configs.normal)
                // for extending sc.PlayerBaseEntity
                // this.model = sc.party.getPartyMemberModel('Emilie')
                // this.animSheet = this.model.animSheet
                // this.initAnimations()
            },
            update() {
                this.parent()
                if (this.rfc.on) {
                    if (ig.Timer.time - this.rfc.startTime > this.rfc.timer) {
                        this.stopRunning()
                        return
                    }
                    if (ig.CollTools.hasWallCollide(this.coll, 1)) {
                        this.stopRunning()
                        this.rfcr.collided = true
                    }
                    if (ig.CollTools.isPostMoveOverHole(this.coll, true)) {
                        this.rfcr.touchedEdge = true
                    }
                }
            },
            runPlayerTrace(seconds): PlayerTraceResult {
                const res: PlayerTraceResult = this.runForward(seconds, 30)
                return res
            },
            runForward(seconds: number, fps: number = 30): PlayerTraceResult {
                this.rfc = {
                    on: true,
                    startTime: ig.Timer.time,
                    timer: seconds
                }
                this.rfcr = { pos: Vec3.create() }

                this.coll.ignoreCollision = false
                Vec2.assign(this.coll.accelDir, this.face)

                const save = saveTickData()

                const now = Date.now()
                ig.Timer._last = now
                for (let i = 0; i < Math.ceil(seconds * fps); i++) {
                    advanceTime(now, i * (1000 / fps))

                    this.coll.updated = 0 /* trick the game to think the entitiy was not just updated */
                    ig.game.physics.updateCollEntry(this.coll, [])
                    if (!this.rfc.on) { break }
                }
                restoreTickData(save)
                // const time = ig.Timer.time - orig.timerTimer
                // console.log(`Tracking done, Time spend: ${time}`)

                this.stopRunning()
                this.rfcr.pos = Vec3.create(this.coll.pos)
                return this.rfcr
            },
            stopRunning() {
                this.rfc.on = false
                Vec2.assignC(this.coll.accelDir, 0, 0)
                Vec2.assignC(this.coll.vel, 0, 0)
                this.coll.ignoreCollision = true
            },
        })

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
    pause() {
        this.paused = true
    }
    resume() {
        this.paused = false
    }

    handle() {
        const p: ig.ENTITY.Player = ig.game.playerEntity
        if (this.paused || ig.game.events.blockingEventCall || !this.predictor || !p || !p.coll?.pos) { return }
        if (ig.game.now - this.lastTrack > this.trackInterval) {
            this.lastTrack = ig.game.now
            this.predictor.setPos(p.coll.pos.x, p.coll.pos.y, p.coll.pos.z)
            this.predictor.face = Vec2.create(p.face)

            const res: PlayerTraceResult = this.predictor.runPlayerTrace(0.6)
            console.log(res.pos.x, res.pos.y, res.pos.y, 'collided', !!res.collided, 'touchedEgde:', !!res.touchedEdge, 'falledInWater:', !!res.fallenInWater)
        }
    }
}
