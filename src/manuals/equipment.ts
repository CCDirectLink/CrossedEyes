import { Lang } from '../lang-manager'
import CrossedEyes from '../plugin'

/* in prestart */

CrossedEyes.initPoststart.push(() => {
    // prettier-ignore
    ig.lang.labels.sc.gui.menu['help-texts'].equip.pages = [
        ...Lang.menu.equipment.prependHelpPages,
        ...ig.lang.labels.sc.gui.menu['help-texts'].equip.pages
    ]
})
