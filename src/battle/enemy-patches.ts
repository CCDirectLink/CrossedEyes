import { MenuOptions } from '../options-manager'
import CrossedEyes, { InitPoststart } from '../plugin'

export class ConditionalEnemyPatcher implements InitPoststart {
    constructor() {
        /* in prestart */
        CrossedEyes.initPoststarters.push(this)
    }
    initPoststart(): void {
        this.updatePatchFiles()
    }

    updatePatchFiles() {
        const optionalAssets: Record<string, string> = {}

        if (MenuOptions.hints) {
            optionalAssets['data/enemies/shredder.json.patch'] = CrossedEyes.mod.baseDirectory + 'assets/data/enemies/shredder.json.patch.cond'
        }

        if (CrossedEyes.mod.isCCL3) {
            Object.entries(optionalAssets).forEach(e => {
                ccmod.resources.assetOverridesTable.set(e[0], e[1])
            })
        } else {
            CrossedEyes.mod.runtimeAssets = optionalAssets
        }
    }
}
