import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { SpecialAction } from '../../special-action'
import { interrupt, speakI, speakIC } from './api'

/* in prestart */
sc.SaveSlotButton.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts) return
        const slot = this.slotOver
        const sg = slot.slotGui
        const name: string = sg instanceof sc.NumberGui ? sg.targetNumber.toString() : sg instanceof sc.TextGui ? sg.text!.toString() : ''

        const chapter: number = this.chapter.chapterGui.targetNumber
        const location: string = this.location.location.text!.toString()
        const speak = Lang.menu.save.template1.supplant({ name, chapter, location })
        speakI(speak)

        const level: number = this.level.targetNumber
        const hours = this.time.hour.targetNumber
        const minutes = this.time.minute.targetNumber
        const playtime = (hours > 0 ? Lang.menu.save.playtimeWithHoursTemplate : Lang.menu.save.playtimeTemplate).supplant({
            minutes,
            hours,
        })
        SpecialAction.setListener('LSP', 'saveMenu', () => {
            speakI(Lang.menu.save.template2.supplant({ level, playtime }))
        })
    },
    focusLost() {
        this.parent()
        SpecialAction.setListener('LSP', 'saveMenu', () => {})
        interrupt()
    },
})

sc.SaveSlotNewButton.inject({
    focusGained() {
        this.parent()
        speakIC(Lang.menu.save.createNewSaveFile)
    },
})
