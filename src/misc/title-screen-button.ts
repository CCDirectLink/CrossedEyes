import { TestMap } from './test-map'

/* https://github.com/krypciak/crosscode-demonizer */
import type * as _ from 'crosscode-demonizer/src/demomod/types.d.ts'

/* in prestart */
if (!ig.isdemo) {
    sc.TitleScreenButtonGui.inject({
        init() {
            this.parent()
            ig.lang.labels.sc.gui['title-screen']['CrossedEyesTestMap'] = 'CrossedEyes test map'
            const titleGuiInstance = this
            this._createButton('CrossedEyesTestMap', this.buttons.last().hook.pos.y + 39, 100 - this.buttons.length, () => {
                TestMap.start(titleGuiInstance)
            })
        },
    })
}
