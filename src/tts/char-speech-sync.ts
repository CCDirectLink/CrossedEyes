import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
import { TextGather, interrupt, speakIC } from './gather/api'
import { SpeechEndListener, TTS } from './tts'

declare global {
    namespace ig {
        interface MessageAreaGui {
            skip(this: this, nextMsg?: boolean): void
        }
    }
    namespace sc {
        interface SideMessageBoxGui {
            beepSound: ig.Sound | null
        }
    }
}
const startDate = Date.now()

export class CharacterSpeechSynchronizer implements SpeechEndListener {
    sideMessageHudGuiIns!: sc.SideMessageHudGui
    messageOverlayGuiIns!: ig.MessageOverlayGui

    private rateCalibCount: number = 5
    private rateCalibData: [number, string][] = []

    constructor() {
        /* in prestart */
        TTS.g.onSpeechEndListeners.push(this)
        const self = this
        ig.MessageOverlayGui.inject({
            init() {
                this.parent()
                self.messageOverlayGuiIns = this
            },
        })
        ig.MessageAreaGui.inject({
            init() {
                this.parent()
            },
            skip(nextMsg: boolean = true) {
                if (Opts.ttsChar) {
                    if (nextMsg) {
                        const msg = this.messages.last()
                        if (!msg.isFinished()) {
                            sc.model.message.clearBlocking()
                        }
                    }
                }
                this.parent()
            },
        })
        sc.MsgBoxGui.inject({
            init(maxWidth, pointerType, text, speed, personEntry, beepSound) {
                if (Opts.ttsChar) {
                    if (Opts.textBeeping) {
                        if (!ig.system.skipMode) {
                            speed = ig.TextBlock.SPEED.SLOWEST / Opts.ttsSpeed
                        }
                    } else beepSound = null
                }
                this.parent(maxWidth, pointerType, text, speed, personEntry, beepSound)
            },
        })

        sc.SideMessageHudGui.inject({
            init() {
                this.parent()
                self.sideMessageHudGuiIns = this
            },
            showNextSideMessage() {
                this.parent()
                if (Opts.ttsChar) {
                    this.timer = 10000000
                    TextGather.ignoreInterruptTo = Date.now() + 100
                }
            },
            onSkipInteract(type) {
                interrupt()
                this.parent(type)
                if (Opts.ttsChar) {
                    if (type == sc.SKIP_INTERACT_MSG.SKIPPED && this.visibleBoxes.length > 0) {
                        this.doMessageStep()
                    }
                    if (this.visibleBoxes.length == 0) speakIC(Lang.msg.sideMsgEnd)
                }
            },
        })
        sc.SideMessageBoxGui.inject({
            init() {
                this.parent()
                if (Opts.ttsChar) {
                    if (Opts.textBeeping) {
                        this.text.setTextSpeed(ig.TextBlock.SPEED.SLOWEST / Opts.ttsSpeed)
                    } else {
                        this.beepSound = null
                    }
                }
            },
        })

        sc.VoiceActing.inject({
            play(expression, label) {
                this.parent(expression, label)
                if (Opts.ttsChar && TTS.g?.ttsInstance?.calibrateSpeed) {
                    if (self.rateCalibData.length <= self.rateCalibCount) {
                        self.rateCalibData.push([Date.now(), TextGather.lastMessage!.toString()])
                    }
                }
            },
        })

        TextGather.addInterruptListener(() => {
            if (TTS.g?.ttsInstance?.calibrateSpeed) {
                if ((self.rateCalibData.last() ?? [])[0] > startDate) self.rateCalibData.pop()
            }
        })
        // sc.getMessageTime = function(textLike: sc.TextLike) {
        //     if (MenuOptions.ttsMenuEnabled) {
        //         return textLike!.toString().length / 20 * 1.8 * MenuOptions.ttsSpeed + 1
        //     } else {
        //         return Math.max(2, (textLike!.toString().length / 20) * 1 + 1) /* original formula */
        //     }
        // }
    }
    onSpeechEnd(): void {
        if (Opts.ttsChar) {
            if (this.sideMessageHudGuiIns.timer > 10000) {
                this.sideMessageHudGuiIns.timer = 1
                this.sideMessageHudGuiIns.visibleBoxes.last().text.finish()
            }
            if (sc.message.blocking && !sc.message.hasChoice()) {
                this.messageOverlayGuiIns.messageArea.skip(false)
            }
            if (TTS.g?.ttsInstance?.calibrateSpeed && this.rateCalibData.length <= this.rateCalibCount && (this.rateCalibData.last() ?? [])[0] > startDate) {
                this.rateCalibData[this.rateCalibData.length - 1][0] = Date.now() - this.rateCalibData.last()[0]
                if (this.rateCalibData.length == this.rateCalibCount) {
                    this.rateCalibCount = 0
                    this.rateCalibData = this.rateCalibData.filter(e => e[0] < 10e3)
                    const cps = this.rateCalibData.map(e => e[1].length / (e[0] / 1000))
                    const avg = cps.reduce((acc, v) => acc + v, 0) / cps.length
                    const newSpeed = Math.max(1, Math.min(3, (Math.round(((avg / 15) * 100) / 5) * 5) / 100))

                    const origSpeed = Opts.ttsSpeed
                    if (Math.abs(origSpeed - newSpeed) >= 0.2) {
                        Opts.ttsSpeed = newSpeed
                        sc.options.persistOptions()
                    }
                }
            }
        }
    }
}
