import { MenuOptions } from '../optionsManager'
import { TextGather } from './gather-text'
import { SpeechEndListener, TTS } from './tts'

export class CharacterSpeechSynchronizer implements SpeechEndListener {
    sideMessageHudGuiIns!: sc.SideMessageHudGui
    messageOverlayGuiIns!: ig.MessageOverlayGui
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
                if (nextMsg && MenuOptions.ttsEnabled) {
                    const msg = this.messages.last()
                    if (!msg.isFinished()) {
                        sc.model.message.clearBlocking()
                    }
                }
                this.parent()
            },
        })
        sc.MsgBoxGui.inject({
            init(maxWidth, pointerType, text, speed, personEntry, beepSound) {
                if (MenuOptions.ttsEnabled) {
                    if (MenuOptions.textBeeping) {
                        if (!ig.system.skipMode) {
                            speed = ig.TextBlock.SPEED.SLOWEST / MenuOptions.ttsSpeed
                        }
                    } else {
                        beepSound = null
                    }
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
                if (MenuOptions.ttsEnabled) {
                    this.timer = 10000000
                    TextGather.g.ignoreInteractTo = Date.now() + 100
                }
            },
            onSkipInteract(type) {
                TextGather.g.interrupt()
                this.parent(type)
                if (MenuOptions.ttsEnabled && type == sc.SKIP_INTERACT_MSG.SKIPPED) {
                    if (this.visibleBoxes.length > 0) {
                        this.doMessageStep()
                    }
                }
                if (this.visibleBoxes.length == 0) {
                    TextGather.g.speakI('Side end')
                }
            },
        })
        sc.SideMessageBoxGui.inject({
            init() {
                this.parent()
                if (MenuOptions.ttsEnabled) {
                    if (MenuOptions.textBeeping) {
                        this.text.setTextSpeed(ig.TextBlock.SPEED.SLOWEST / MenuOptions.ttsSpeed)
                    } else {
                        this.beepSound = null
                    }
                }
            },
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
        if (MenuOptions.ttsEnabled) {
            if (this.sideMessageHudGuiIns.timer > 10000) {
                this.sideMessageHudGuiIns.timer = 1
                this.sideMessageHudGuiIns.visibleBoxes.last().text.finish()
            }
            if (sc.message.blocking && !sc.message.hasChoice()) {
                this.messageOverlayGuiIns.messageArea.skip(false)
            }
        }
    }
}
