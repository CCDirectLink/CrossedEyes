import { Lang } from '../lang-manager'
import CrossedEyes from '../plugin'

/* in prestart */

CrossedEyes.initPoststart.push(() => {
    ig.lang.labels.sc.gui.menu['help-texts'].options.pages[0].content.push(Lang.menu.options.helpSuffix)
})
