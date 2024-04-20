import { Opts } from '../plugin'
import type * as _ from 'nax-ccuilib/src/headers/nax/quick-menu-public-api.d.ts'

export function updateQuickRingMenuLayoutLock() {
    nax.ccuilib.QuickRingMenuWidgets.lockLayout = Opts.lockDiorbitalMenu
    if (nax.ccuilib.QuickRingMenuWidgets.lockLayout) {
        nax.ccuilib.QuickRingMenuWidgets.ringConfiguration = {
            [nax.ccuilib.quickRingUtil.getIdFromRingPos(0, 0)]: '11_items',
            [nax.ccuilib.quickRingUtil.getIdFromRingPos(0, 2)]: '11_analyze',
            [nax.ccuilib.quickRingUtil.getIdFromRingPos(0, 4)]: '11_party',
            [nax.ccuilib.quickRingUtil.getIdFromRingPos(0, 6)]: '11_map',
            [nax.ccuilib.quickRingUtil.getIdFromRingPos(0, 7)]: 'cc-blitzkrieg_puzzleSkip',
        }
    }
}
