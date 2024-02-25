import { Lang } from '../../lang-manager'
import { interrupt, speakArgsC } from './api'

/* in prestart */
sc.ModalButtonInteract.inject({
    show() {
        speakArgsC(Lang.menu.dialog, this.textGui.text!)
        this.parent()
    },
    hide() {
        interrupt()
        this.parent()
    },
})
