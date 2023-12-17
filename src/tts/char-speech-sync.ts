import { MenuOptions } from '../options'
import CrossedEyes, { InitPoststart } from '../plugin'
import { SpeechEndListener, TTS } from './tts'

export class CharacterSpeechSynchronizer implements InitPoststart, SpeechEndListener {
    messageOverlayGuiIns!: ig.MessageOverlayGui
    constructor() { /* in prestart */
        CrossedEyes.initPoststarters.push(this)
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
    initPoststart(): void {
        TTS.g.ttsInstance.speechEndEvents.push(this)
    }
    onSpeechEnd(): void {
        if (MenuOptions.ttsEnabled && sc.message.blocking) {
            console.log('end')
            this.messageOverlayGuiIns.messageArea.skip()
        }
    }
}
