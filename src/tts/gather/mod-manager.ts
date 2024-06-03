import { speakI, speakIC } from './api'
import { Opts } from '../../options'
import { SpecialAction } from '../../special-action'

import type * as _ from 'ccmodmanager/types/gui/list-entry'
import type * as __ from 'ccmodmanager/types/gui/menu'
import type { ModEntryLocal, ModEntryServer } from 'ccmodmanager/src/types.d.ts'
import { Lang } from '../../lang-manager'

let ignoreModEntryButtonPressFrom: number = 0
export function modManager_setignoreModEntryButtonPressFrom(value: number) {
    ignoreModEntryButtonPressFrom = value
}

/* in prestart */
sc.ModListEntry.inject({
    focusGained() {
        this.parent()
        if (!Opts.tts) return
        const m = this.mod
        const lm: ModEntryLocal | undefined = m.isLocal ? m : m.localCounterpart
        const sm: ModEntryServer | undefined = m.isLocal ? m.serverCounterpart : m
        let str = `${Lang.menu.modMenu.mod}: ${m.name}, `
        if (this.nameText.text?.toString().startsWith('\\c[3]')) str += `${Lang.menu.modMenu.selected}, `
        if (lm) str += `${lm.active ? Lang.menu.modMenu.enabled : Lang.menu.modMenu.disabled}, `
        if (m.awaitingRestart) str += `${Lang.menu.modMenu.awaitingRestart}, `
        if (lm?.hasUpdate) str += `${Lang.menu.modMenu.hasUpdateAvailible}, `
        const iconText = this.nameIconPrefixesText.text?.toString()
        if (iconText?.includes('testing-on')) str += `${Lang.menu.modMenu.testingOn}, `
        else if (iconText?.includes('testing-off')) str += `${Lang.menu.modMenu.testingOff}, `

        speakI(str)

        let desc = `${m.description ?? ''}.\n`
        if (sm) desc += `${Lang.menu.modMenu.tags}: ${sm.tags.join(': ')}.\n`
        desc += `${(sm?.authors.length ?? 0) > 1 ? Lang.menu.modMenu.authors : Lang.menu.modMenu.author}: ${sm ? sm.authors.join(': ') : Lang.misc.unknown}.\n`
        if (sm) desc += `${Lang.menu.modMenu.stars}: ${sm.stars}.\n`
        desc += `${Lang.menu.modMenu.version}: ${m.version.replace(/\./g, ': ')}.\n`
        if (sm?.lastUpdateTimestamp)
            desc += `${Lang.menu.modMenu.lastUpdated}: ${new Date(sm.lastUpdateTimestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}.\n`

        SpecialAction.setListener('LSP', 'modMenuDescription', () => speakI(desc))
    },
    focusLost() {
        SpecialAction.setListener('LSP', 'modMenuDescription', () => {})
        this.parent()
    },
    onButtonPress() {
        const resp = this.parent() as string | undefined
        if (resp && Date.now() - ignoreModEntryButtonPressFrom > 50) speakIC(resp)
        return resp
    },
})

sc.ModMenuList.inject({
    setTab(index, ignorePrev, settings) {
        const isSame = this.currentTabIndex == index
        this.parent(index, ignorePrev, settings)
        if (Opts.tts && !isSame) {
            const elements = sc.modMenuGui.list.currentList.buttonGroup.elements.flat()
            if (elements.length == 0) speakI(Lang.menu.modMenu.empty)
        }
    },
})

sc.ModMenu.inject({
    showModInstallDialog() {
        let say = false
        if (this.list.currentTabIndex != sc.MOD_MENU_TAB_INDEXES.SELECTED) say = true
        this.parent()
        say && speakIC(ig.lang.get('sc.gui.dialogs.yes'))
    },
})
