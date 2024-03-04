import { Opts } from '../../plugin'
import { interrupt, speakIC } from './api'

sc.HelpScreen.inject({
    openMenu() {
        this.parent()
        if (!Opts.tts) return
        /* automaticly open the manual menu when entering the help screen */
        this.onHelpButtonPressed()
        /* close the whole menu when closing the manual gui */
        const self = this
        const manualGuiCloseMenu = this.manualGui.closeMenu.bind(this.manualGui)
        this.manualGui.closeMenu = function (this: sc.MultiPageBoxGui) {
            manualGuiCloseMenu()
            self.onBackButtonPressed()
            sc.BUTTON_SOUND.back.play()
            interrupt()
        }
    },
})
sc.MultiPageBoxGui.inject({
    _setPage(index: number) {
        this.parent(index)
        speakIC(`${this.header.text!.toString()}: ${this.pages[index].content.filter(str => !str.startsWith('!!')).join(' ')}`)
    },
    closeMenu() {
        this.parent()
        interrupt()
    },
})
