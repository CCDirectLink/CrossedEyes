import { MenuOptions } from '../options'
import { SpeechEndListener, TTS } from './tts'

export class CharacterSpeechSynchronizer implements SpeechEndListener {
    constructor() { /* in prestart */
        TTS.g.onSpeechEndListeners.push(this)
        const self = this
        ig.MessageOverlayGui.inject({
            init() {
                this.parent()
                self.messageOverlayGuiIns = this
            },
        })
        sc.MsgBoxGui.inject({
            init(maxWidth, pointerType, text, speed, personEntry, beepSound) {
                if (MenuOptions.ttsEnabled) {
                    speed = ig.TextBlock.SPEED.IMMEDIATE
                    beepSound = null
                }
                this.parent(maxWidth, pointerType, text, speed, personEntry, beepSound)
            },
        })
    }
    onSpeechEnd(): void {
        if (MenuOptions.ttsEnabled && sc.message.blocking) {
            console.log('end')
            this.messageOverlayGuiIns.messageArea.skip()
        }
    }
}
