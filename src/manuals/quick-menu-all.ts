import { Lang } from '../lang-manager'
import { Opts } from '../options'
import { isManualVisible, openManualScreen } from './all'

let manual: sc.MultiPageBoxGui
export function isQuickMenuManualVisible() {
    return isManualVisible(manual)
}

export function injectQuickMenuManuals() {
    /* in prestart */
    sc.Control.inject({
        quickmenu() {
            if (isQuickMenuManualVisible()) return true
            return this.parent()
        },
    })
    sc.QuickMenu.inject({
        update() {
            this.parent()
            if (Opts.tts && sc.control.menuHotkeyHelp() && sc.quickmodel.activeState && sc.quickmodel.isQuickNone() && !isQuickMenuManualVisible()) {
                manual = openManualScreen(Lang.menu.quickMenu.noneHelpPages)
            }
        },
    })
    sc.QuickItemMenu.inject({
        update() {
            this.parent()
            if (Opts.tts && sc.control.menuHotkeyHelp() && sc.quickmodel.isQuickItems() && !isQuickMenuManualVisible()) {
                manual = openManualScreen(Lang.menu.quickMenu.itemHelpPages)
            }
        },
    })
    sc.QuickMenuAnalysis.inject({
        update() {
            this.parent()
            if (Opts.tts && sc.control.menuHotkeyHelp() && sc.quickmodel.isQuickCheck() && !isQuickMenuManualVisible()) {
                manual = openManualScreen(Lang.menu.quickMenu.analysisHelpPages)
            }
        },
    })
}
