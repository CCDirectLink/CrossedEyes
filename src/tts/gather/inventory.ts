import { Opts } from '../../plugin'
import { SpecialAction } from '../../special-action'
import { interrupt, speakI } from './api'

export {}

sc.ItemBoxButton.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts) return
        speakI(this.button.text!.toString())
        SpecialAction.setListener('LSP', 'inventoryItemDescription', () => speakI(this.data.description))
    },
    focusLost() {
        this.parent()
        interrupt()
        if (!Opts.tts) return
        SpecialAction.setListener('LSP', 'inventoryItemDescription', () => {})
    },
})
