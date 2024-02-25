import { Opts } from '../../plugin'
import { interrupt, speakI } from './api'

/* in prestart */
sc.InputForcer.inject({
    setEntry(action, title, textKeyboard, textGamepad) {
        if (Opts.tts) {
            textGamepad = ig.LangLabel.getText(textGamepad as ig.LangLabel.Data)
            if (textGamepad == 'Press \\i[throw] + \\i[throw] + \\i[throw] + \\i[throw]') {
                textGamepad = 'Press \\i[throw] or \\i[gamepad-x] 4 times'
            }
            this.parent(action, title, textKeyboard, textGamepad)
            speakI(`${ig.LangLabel.getText(title as ig.LangLabel.Data)}: ${textGamepad}`)
        } else {
            this.parent(action, title, textKeyboard, textGamepad)
        }
    },
    _endBlock() {
        interrupt()
        this.parent()
    },
})

/* fix sc.InputForcer not accepting Gamepad X as a attack button and forcing R1 */
sc.Control.inject({
    fullScreenAttacking(): boolean {
        return sc.control.autoControl
            ? sc.control.autoControl.get('attacking')
            : ig.input.pressed('aim') ||
                  ig.gamepad.isButtonPressed(sc.control._getAttackButton()) ||
                  /* fix here -> */ ig.gamepad.isButtonPressed(sc.control._getMeleeButton())
    },
})
sc.INPUT_FORCER_ENTRIES.ATTACK_LEFT = {
    cancelAction: true,
    check: function () {
        return !sc.control.fullScreenAttacking() ? false : true
    },
    keep: false,
}
