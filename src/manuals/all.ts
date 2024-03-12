import { SpecialAction } from '../special-action'
import { injectQuickMenuManuals } from './quick-menu-all'

export async function addMenuManuals() {
    injectQuickMenuManuals()
    await import('./equipment')
    await import('./options')
}

export function openManualScreen(pages: sc.MultiPageBoxGui.ConditionalPage[]) {
    const manual = new sc.MultiPageBoxGui()
    manual.addPages(pages)
    manual.hook.zIndex = 2e5
    manual.hook.pauseGui = true
    ig.gui.addGuiElement(manual)
    manual.openMenu()
    SpecialAction.clearKey('LSP')
    return manual
}

export function isManualVisible(manual?: sc.MultiPageBoxGui) {
    return manual?.hook.currentStateName == 'DEFAULT'
}
