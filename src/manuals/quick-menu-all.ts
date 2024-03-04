import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
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
