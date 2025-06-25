import { Opts } from '../options'
import CrossedEyes from '../plugin'
import { HintSystem, HintUnion } from './hint-system'
import { TTS } from '../tts/tts'
import { SoundManager } from '../sound-manager'
import { Lang } from '../lang-manager'
import { PauseListener } from '../misc/menu-pause'

export function isAiming(): boolean {
    return ig.input.state('aim') || ig.gamepad.isRightStickDown()
}

export class AimAnalyzer implements PauseListener {
    static g: AimAnalyzer

    lastUuids: string | undefined
    aimAnalyzeOn: boolean = false
    aimBounceOn: boolean = false
    wallScanOn: boolean = false

    aimSpeakQueue: ({ hit: true; bouncePos: Vec3 } | { hit: false; hint: HintUnion })[] = []

    bounceSoundIndex: number = 0

    wallScanHandle?: ig.SoundHandle

    constructor() {
        /* in prestart */
        AimAnalyzer.g = this
        CrossedEyes.pauseables.push(this)
        TTS.g.onSpeechEndListeners.push(this)
        const self = this

        let quickMenuExitedTime: number = 0
        sc.QuickMenuModel.inject({
            exitQuickMenu() {
                this.parent()
                quickMenuExitedTime = ig.Timer.time
            },
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (self.aimAnalyzeOn) {
                    self.handle(!self.aimBounceOn)
                }
                self.handleWallScan()
            },
            /* keep the aim in the quick menu and after closing it */
            handleStateStart(playerState, inputState) {
                if (Opts.hints && playerState.startState == 0 && sc.control.aiming() && ig.Timer.time <= quickMenuExitedTime + 0.02) {
                    /* do nothing (instead of canceling aiming), just call cancelJump() because it is always called (and im not calling parent) */
                    this.cancelJump()
                } else {
                    this.parent(playerState, inputState)
                }
            },
            /* disable player float up/down movement */
            varsChanged() {
                this.parent!()
                if (Opts.hints && this.floating && ig.vars.get('playerVar.staticFloat')) {
                    this.configs.normal.clearOverwrite()
                    this.configs.aiming.clearOverwrite()
                }
            },
        })

        const aimAnalysisId = 'crossedeyes-aimAnalysis'
        self.aimAnalyzeOn = localStorage[`ccuilib-quickmenuwidget-${aimAnalysisId}`] == 'true'
        nax.ccuilib.QuickRingMenuWidgets.addWidget({
            name: aimAnalysisId,
            title: Lang.menu.quickMenu.widgets.aimAnalysis.title,
            description: Lang.menu.quickMenu.widgets.aimAnalysis.description,
            pressEvent: button => {
                self.aimAnalyzeOn = button.isToggleOn()
            },
            toggle: true,
            image: () => ({
                gfx: new ig.Image('media/gui/circuit-icons.png'),
                srcPos: { x: 193, y: 25 },
                pos: { x: 4, y: 4 },
                size: { x: 24, y: 24 },
            }),
        })

        const aimBounceId = 'crossedeyes-aimBounce'
        self.aimBounceOn = localStorage[`ccuilib-quickmenuwidget-${aimBounceId}`] == 'true'
        nax.ccuilib.QuickRingMenuWidgets.addWidget({
            name: aimBounceId,
            title: Lang.menu.quickMenu.widgets.aimBounce.title,
            description: Lang.menu.quickMenu.widgets.aimBounce.description,
            pressEvent: button => {
                self.aimBounceOn = button.isToggleOn()
            },
            toggle: true,
            image: () => ({
                gfx: new ig.Image('media/gui/circuit-icons.png'),
                srcPos: { x: 1, y: 97 },
                pos: { x: 4, y: 4 },
                size: { x: 24, y: 24 },
            }),
        })

        const wallScanId = 'crossedeyes-wallScan'
        self.wallScanOn = localStorage[`ccuilib-quickmenuwidget-${wallScanId}`] == 'true'
        nax.ccuilib.QuickRingMenuWidgets.addWidget({
            name: wallScanId,
            title: Lang.menu.quickMenu.widgets.wallScan.title,
            description: Lang.menu.quickMenu.widgets.wallScan.description,
            pressEvent: button => {
                self.wallScanOn = button.isToggleOn()
            },
            toggle: true,
            image: () => ({
                gfx: new ig.Image('media/gui/circuit-icons.png'),
                srcPos: { x: 97, y: 193 },
                pos: { x: 4, y: 4 },
                size: { x: 24, y: 24 },
            }),
        })
    }

    pause(): void {
        this.lastUuids = undefined
        this.aimSpeakQueue = []
    }

    onSpeechEnd() {
        this.moveQueue()
    }

    moveQueue() {
        const entry = this.aimSpeakQueue.shift()
        if (entry) {
            if (entry.hit) {
                SoundManager.playSound((['bounce1', 'bounce2', 'bounce3'] as const)[(this.bounceSoundIndex = (this.bounceSoundIndex + 1) % 3)], 1, 1, entry.bouncePos)
                setTimeout(() => this.moveQueue(), 500)
            } else {
                setTimeout(() => HintSystem.g.activateHint(entry.hint.entity), 100)
            }
        }
    }

    handle(tillBounce: boolean) {
        const deactivate = () => {
            this.lastUuids = undefined
            HintSystem.g.deactivateHint(HintSystem.g.focusedHE)
        }
        if (isAiming() && ig.game.playerEntity.gui.crosshair?.active) {
            let allHints = this.predictBounceHints()

            if (tillBounce || !sc.model.player.getCore(sc.PLAYER_CORE.CHARGE)) {
                const bounceIndex = allHints.findIndex(h => h.hit)
                if (bounceIndex != -1) {
                    allHints.splice(bounceIndex)
                }
            }
            if (allHints.length > 1 && allHints.find(h => h.hit)) {
                const last = allHints.last()
                if (last.hit) throw new Error('what?')
                const isWhitelisted = last.hint.entity.getQuickMenuSettings!().aimBounceWhitelist
                if (!isWhitelisted) allHints.splice(allHints.findIndex(h => h.hit))
            }
            let uuids: string = allHints
                .map(hint => (hint.hit ? 'b' : hint.hint.entity.uuid))
                .join('|')
                .trim()
            if (!uuids) {
                deactivate()
                return
            }
            if (uuids == this.lastUuids) return
            this.lastUuids = uuids
            this.bounceSoundIndex = 0
            this.aimSpeakQueue = allHints
            this.moveQueue()
        } else deactivate()
    }

    private tracePath(
        pos: Vec2,
        dir: Vec2,
        bouncePoints: number,
        maxPoint: number,
        maxBounce: number,
        outArr: ig.CollEntry[][] = []
    ): (ig.CollEntry[] & { bouncePos?: Vec3 })[] {
        const player = ig.game.playerEntity
        let zPos = player.coll.pos.z
        if (player.maxJumpHeight !== undefined && player.maxJumpHeight >= 0) {
            zPos = Math.min(player.coll.pos.z, player.maxJumpHeight)
        }
        zPos += Constants.BALL_HEIGHT
        const dist = 24
        let dotCnt = 12
        Vec2.length(dir, dist * dotCnt)

        let c_res: { dir?: Vec2 } = {}
        const res = ig.game.physics.initTraceResult(c_res)
        const hitEntityList: ig.CollEntry[] = []

        ig.game.physics._trackEntityTouch = true
        const collided = ig.game.trace(
            res,
            pos.x,
            pos.y,
            zPos,
            dir.x,
            dir.y,
            Constants.BALL_SIZE,
            Constants.BALL_SIZE,
            Constants.BALL_Z_HEIGHT,
            ig.COLLTYPE['PROJECTILE'],
            null,
            hitEntityList
        )
        ig.game.physics._trackEntityTouch = false

        let c_tmpPoint: Vec3 = Vec3.create()
        Vec2.assign(c_tmpPoint, dir)
        Vec2.mulF(c_tmpPoint, res.dist)
        Vec2.add(c_tmpPoint, pos)
        c_tmpPoint.z = zPos

        let ballBlocked = false
        outArr.push([])
        const arr: ig.CollEntry[] & { bouncePos?: Vec3 } = outArr.last()
        for (let i = 0; i < hitEntityList.length; ++i) {
            const entry = hitEntityList[i]
            arr.push(entry)
            const e: ig.Entity = entry.entity
            if (e.ballDestroyer || (e.isBallDestroyer && e.isBallDestroyer(c_tmpPoint, res))) {
                ballBlocked = true
                break
            }
        }
        dotCnt *= Math.max(0, res.dist)

        Vec2.length(dir, dist)
        let decreased = false
        let ret: boolean = false
        for (let i = 1; i < dotCnt + 0.8; i++) {
            decreased = true
            if (!--maxPoint) {
                ret = true
                break
            }
        }
        if (!decreased) {
            if (!--maxPoint) {
                ret = true
            }
        }
        arr.bouncePos = Vec3.create(c_tmpPoint)
        if (ret) {
            return outArr
        }
        if (collided && !ballBlocked && bouncePoints && maxBounce) {
            Vec2.length(dir, dist * dotCnt)
            Vec2.add(pos, dir)
            const dot = Vec2.dot(dir, res.dir)
            let c_offset: Vec2 = Vec2.create()
            Vec2.sub(dir, Vec2.mulF(res.dir, 2 * dot, c_offset))

            const cnt = Math.min(maxPoint, bouncePoints)

            return this.tracePath(pos, dir, cnt, cnt, maxBounce - 1, outArr)
        }
        return outArr
    }

    private fullTracePath(maxBounce: number = 3, bouncePoints: number = 10, maxPoint: number = 12) {
        const player = ig.game.playerEntity
        let c_pos: Vec2 = Vec2.create()
        const pos = Vec2.assign(c_pos, player.coll.pos)
        pos.x += player.coll.size.x / 2 - Constants.BALL_SIZE / 2
        pos.y += player.coll.size.y / 2 - Constants.BALL_SIZE / 2

        const dir = Vec2.create(player.face)
        return this.tracePath(pos, dir, bouncePoints, maxPoint, maxBounce)
    }

    predictBounceHints(): ({ hit: true; bouncePos: Vec3 } | { hit: false; hint: HintUnion })[] {
        const entries = this.fullTracePath()

        const hints: ({ hit: true; bouncePos: Vec3 } | { hit: false; hint: HintUnion })[] = []
        let lastHintUuid: string | undefined
        for (const bounceEntries of entries) {
            let isFirstHint: boolean = true
            for (const entry of bounceEntries) {
                const hint: HintUnion | undefined = HintSystem.g.quickMenuAnalysisInstance.createHint(entry.entity, false)
                if (hint) {
                    if (isFirstHint && lastHintUuid == hint.entity.uuid) {
                        isFirstHint = false
                    } else {
                        hints.push({ hit: false, hint })
                    }
                    lastHintUuid = hint.entity.uuid
                }
            }
            if (bounceEntries.bouncePos) {
                hints.push({ hit: true, bouncePos: bounceEntries.bouncePos })
            }
        }
        while (hints.last()?.hit) {
            hints.splice(hints.length - 1)
        }
        return hints
    }

    handleWallScan() {
        const deactivate = () => {
            this.wallScanHandle?.stop()
            this.wallScanHandle = undefined
        }
        if (!(this.wallScanOn && isAiming() && ig.game.playerEntity.gui.crosshair?.active)) {
            deactivate()
            return
        }
        const entries = this.fullTracePath(0, 100, 100)
        const last = entries.last()
        if (last?.bouncePos === undefined) {
            deactivate()
            return
        }
        if (!this.wallScanHandle) {
            this.wallScanHandle = new ig.Sound(SoundManager.sounds.wall, 2 * Opts.wallScanVolume).play(true)
        }
        const handle = this.wallScanHandle

        const dist = Vec3.distance(ig.game.playerEntity.coll.pos, last.bouncePos)

        const maxRange = 30 * 16
        const diff = maxRange - dist
        const range = diff > maxRange * 0.4 ? maxRange : dist
        handle.setFixPosition(last.bouncePos, range)
        if (handle._nodePosition) {
            handle._nodePosition.refDistance = 0.1 * handle.pos!.range
            handle._nodePosition.maxDistance = handle.pos!.range
        }
        handle._setPosition()
    }
}
