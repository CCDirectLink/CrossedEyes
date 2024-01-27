import CrossedEyes, { InitPoststart } from './plugin'
import { Opts } from './options-manager'

export class RuntimeResources implements InitPoststart {
    constructor() {
        /* in prestart */
        CrossedEyes.initPoststarters.push(this)
    }

    initPoststart() {
        if (Opts.hints) {
            RuntimeResources.add('data/enemies/shredder.json.patch', 'assets/data/enemies/shredder.json.patch.cond')
        }
        RuntimeResources.reload()
    }

    private static assets: Record<string, string> = {}
    private static everAdded: Set<string> = new Set()

    static add(dest: string, from: string) {
        RuntimeResources.assets[dest] = CrossedEyes.mod.baseDirectory + from
        this.everAdded.add(dest)
    }

    static reload() {
        if (CrossedEyes.mod.isCCL3) {
            for (const asset of this.everAdded) {
                ccmod.resources.assetOverridesTable.delete(asset)
            }
            Object.entries(this.assets).forEach(e => {
                ccmod.resources.assetOverridesTable.set(e[0], e[1])
            })
        } else {
            CrossedEyes.mod.runtimeAssets = this.assets
        }
    }
}
