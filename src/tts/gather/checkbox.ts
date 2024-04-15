import { Lang } from '../../lang-manager'
import { speakIC } from './api'

import './checkbox.d'

/* in prestart */
sc.CheckboxGui.inject({
    invokeButtonPress() {
        this.parent()
        speakIC(Lang.misc[this.pressed ? 'true' : 'false'])
    },
    focusGained() {
        this.parent()
        this.crossedeyesLabel?.trim() && speakIC(`${Lang.menu.options.checkbox}: ${this.crossedeyesLabel.trim()}, ${Lang.misc[this.pressed ? 'true' : 'false']}`)
    },
})
