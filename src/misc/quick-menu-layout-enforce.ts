import { Opts } from '../plugin'
import type * as _ from 'nax-ccuilib/src/headers/nax/quick-menu-public-api.d.ts'

export function updateQuickRingMenuLayoutLock() {
    nax.ccuilib.QuickRingMenuWidgets.lockLayout = Opts.lockDiorbitalMenu
    if (nax.ccuilib.QuickRingMenuWidgets.lockLayout) {
        nax.ccuilib.QuickRingMenuWidgets.ringConfiguration = {
            0: '11_items',
            1: 'crossedeyes-yLevelAnnounce',
            2: '11_analyze',
            4: '11_party',
            6: '11_map',
            7: 'crossedeyes-cliffSafeguard',
            1000: 'crossedeyes-aimAnalysis',
            1002: 'crossedeyes-wallScan',
            1012: 'cc-blitzkrieg_puzzleSkip',
            1014: 'crossedeyes-aimBounce',
        }
    }
}
