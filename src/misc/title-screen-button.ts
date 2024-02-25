import { TestMap } from './test-map'

/* in prestart */
if (!ig.isdemo /* https://github.com/krypciak/crosscode-demonizer */) {
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
