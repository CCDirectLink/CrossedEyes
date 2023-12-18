import { MenuOptions } from '../options'
import { TextGather } from './gather-text'
import { SpeechEndListener, TTS } from './tts'

export class CharacterSpeechSynchronizer implements SpeechEndListener {
    sideMessageHudGuiIns!: sc.SideMessageHudGui
    constructor() { /* in prestart */
        TTS.g.onSpeechEndListeners.push(this)
        const self = this
        sc.MsgBoxGui.inject({
            init(maxWidth, pointerType, text, speed, personEntry, beepSound) {
                if (MenuOptions.ttsEnabled) {
                    speed = ig.TextBlock.SPEED.IMMEDIATE
                    beepSound = null
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
                if (MenuOptions.ttsEnabled) { this.timer = 10000000 }
            },
            onSkipInteract(type) {
                TextGather.g.interrupt()
                this.parent(type)
                if (this.visibleBoxes.length == 0) {
                    MenuOptions.ttsEnabled && TextGather.g.speakI('Side end')
                }
            },
        })
        sc.SideMessageBoxGui.inject({
            init() {
                this.parent()
                if (MenuOptions.ttsEnabled) {
                    this.text.setTextSpeed(ig.TextBlock.SPEED.IMMEDIATE)
                    this.beepSound = null
                }
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
        if (MenuOptions.ttsEnabled) {
            if (this.sideMessageHudGuiIns.timer > 1000000) {
                this.sideMessageHudGuiIns.timer = 0.3
            }
            // this.messageOverlayGuiIns.messageArea.skip()
        }
    }
}
