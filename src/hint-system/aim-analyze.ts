import { MenuOptions } from '../options-manager'
import { TextGather } from '../tts/gather-text'
import CrossedEyes, { PauseListener } from '../plugin'
import { HintSystem, HintUnion } from './hint-system'
import { TTS } from '../tts/tts'
import { SoundManager } from '../sound-manager'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

export function isAiming(): boolean {
    return ig.input.state('aim') || ig.gamepad.isRightStickDown()
}

export class AimAnalyzer implements PauseListener {
    static g: AimAnalyzer

    lastUuids: string | undefined
    aimAnnounceOn: boolean = false
    aimBounceOn: boolean = false

    aimSpeakQueue: ({ hit: true; bouncePos: Vec3 } | { hit: false; hint: HintUnion })[] = []

    bounceSoundIndex: number = 0

    constructor() {
        /* in prestart */
        AimAnalyzer.g = this
        CrossedEyes.pauseables.push(this)
        TTS.g.onSpeechEndListeners.push(this)
        const self = this
        ig.Entity.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.uuid = crypto.createHash('sha256').update(`${settings.name}-${x},${y}`).digest('hex')
            },
        })
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (self.aimAnnounceOn) {
                    if (self.aimBounceOn) {
                        self.handle(false)
                    } else {
                        self.handle(true)
                    }
                }
            },
            /* keep the aim in the quick menu and after closing it */
            handleStateStart(playerState, inputState) {
                if (MenuOptions.hints && playerState.startState == 0 && sc.control.aiming() && ig.Timer.time <= quickMenuExitedTime + 0.02) {
                    /* do nothing (instead of canceling aiming), just call cancelJump() because it is always called (and im not calling parent) */
                    this.cancelJump()
                } else {
                    this.parent(playerState, inputState)
                }
            },
            /* disable player float up/down movement */
            varsChanged() {
                this.parent!()
                if (MenuOptions.hints && this.floating && ig.vars.get('playerVar.staticFloat')) {
                    this.configs.normal.clearOverwrite()
                    this.configs.aiming.clearOverwrite()
                }
            },
        })

        let quickMenuExitedTime: number = 0
        sc.QuickMenuModel.inject({
            exitQuickMenu() {
                this.parent()
                quickMenuExitedTime = ig.Timer.time
            },
        })

        sc.RingMenuButton.inject({
            invokeButtonPress() {
                this.parent()
                /* deactivate the X button after entering a quick menu mode to fix aim bounce toggling on enter */
                for (const states of ig.gamepad.activeGamepads) {
                    states.pressedStates[ig.BUTTONS.FACE0] = false
                }
            },
        })
        sc.QuickMenuAnalysis.inject({
            update() {
                this.parent()
                if (MenuOptions.hints && sc.quickmodel.isQuickCheck()) {
                    if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE3 /* y */)) {
                        self.aimAnnounceOn = !self.aimAnnounceOn
                        MenuOptions.ttsEnabled && TextGather.g.speakI(`Aim analysis: ${self.aimAnnounceOn ? 'on' : 'off'}`)
                    } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE0 /* a */)) {
                        self.aimBounceOn = !self.aimBounceOn
                        MenuOptions.ttsEnabled && TextGather.g.speakI(`Aim bounce: ${self.aimBounceOn ? 'on' : 'off'}`)
                    }
                }
            },
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
                setTimeout(() => HintSystem.g.activateHint(0, entry.hint), 100)
            }
        }
    }

    handle(tillBounce: boolean) {
        const deactivate = () => {
            this.lastUuids = undefined
            HintSystem.g.deactivateHint(0)
        }
        if (isAiming() && ig.game.playerEntity.gui.crosshair?.active) {
            const allHints = this.predictBounceHints()

            if (tillBounce || !sc.model.player.getCore(sc.PLAYER_CORE.CHARGE)) {
                const bounceIndex = allHints.findIndex(h => h.hit)
                if (bounceIndex != -1) {
                    allHints.splice(bounceIndex)
                }
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
        alpha: number,
        bouncePoints: number,
        maxPoint: number,
        maxBounce: number,
        outArr: ig.Physics.CollEntry[][] = []
    ): (ig.Physics.CollEntry[] & { bouncePos?: Vec3 })[] {
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
        const hitEntityList: ig.Physics.CollEntry[] = []

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
        const arr: ig.Physics.CollEntry[] & { bouncePos?: Vec3 } = outArr.last()
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

            return this.tracePath(pos, dir, Math.max(0.25, alpha * 0.75), cnt, cnt, maxBounce - 1, outArr)
        }
        return outArr
    }

    predictBounceHints(): ({ hit: true; bouncePos: Vec3 } | { hit: false; hint: HintUnion })[] {
        const player = ig.game.playerEntity
        let c_pos: Vec2 = Vec2.create()
        const pos = Vec2.assign(c_pos, player.coll.pos)
        pos.x += player.coll.size.x / 2 - Constants.BALL_SIZE / 2
        pos.y += player.coll.size.y / 2 - Constants.BALL_SIZE / 2
        const alpha = 1
        const bouncePoints = 10
        const maxPoint = 12
        const maxBounce = 3

        const dir = Vec2.create(player.face)
        const entries = this.tracePath(pos, dir, alpha, bouncePoints, maxPoint, maxBounce)

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
}
