import { Lang } from '../../lang-manager'
import { interrupt, speakArgsC, speakIC } from './api'
import { modManager_setignoreModEntryButtonPressFrom } from './mod-manager'

/* in prestart */
sc.ModalButtonInteract.inject({
    show() {
        speakArgsC(Lang.menu.dialog, this.textGui.text!)
        modManager_setignoreModEntryButtonPressFrom(Date.now())
        this.parent()
    },
    hide() {
        interrupt()
        this.parent()
    },
})

sc.ModalScreenInteract.inject({
    init(text, icon, iconLeft, callback) {
        this.parent(text, icon, iconLeft, callback)
        speakIC(Lang.menu.dialogNoOptions.supplant({ text: this.textGui.text! }))
        modManager_setignoreModEntryButtonPressFrom(Date.now())
    },
    _close() {
        this.parent()
        interrupt()
    },
})
