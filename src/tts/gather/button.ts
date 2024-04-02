import { Opts } from '../../plugin'
import { speak, speakI } from './api'

let ignoreFrom: number = 0
export function button_setIgnoreFrom(value: number) {
    ignoreFrom = value
}

let sayChoice: boolean = true
export function button_setSayChoice(value: boolean) {
    sayChoice = value
}

const excludeButtonClasses: number[] = []
export function button_excludeButtonClass(clazz: ImpactClass<{ getButtonText(): string }> /* ensure that clazz extends sc.ButtonGui */) {
    excludeButtonClasses.push(clazz.classId)
}

sc.ButtonGui.inject({
    focusGained() {
        if (Opts.tts) {
            const diff = Date.now() - ignoreFrom
            if (diff > 50 && !excludeButtonClasses.some(classId => this.classId == classId)) {
                if (sayChoice && sc.message.blocking && !ig.game.paused && !ig.loading && !sc.model.isTitle()) {
                    speak(this.text!)
                    sayChoice = false
                } else {
                    speakI(this.text!)
                }
            }
        }
        return this.parent()
    },
})
