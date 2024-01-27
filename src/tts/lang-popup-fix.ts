import { Opts } from '../options-manager'

export class LangPopupFix {
    constructor() {
        /* in prestart */
        sc.OptionLangPopUp.inject({
            show(...args) {
                this.buttongroup.clear()
                let i = 0
                for (const lang in sc.LANGUAGE) {
                    const button = this.buttons[sc.LANGUAGE[lang] as unknown as sc.LANGUAGE]
                    const args: [number, number] = Opts.tts ? [0, i] : [i % 2, (i / 2).floor()]
                    this.buttongroup.addFocusGui(button, ...args)
                    i++
                }
                this.parent(...args)
            },
        })
    }
}
