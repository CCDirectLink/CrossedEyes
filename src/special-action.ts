import CrossedEyes from './plugin'

export class SpecialAction {
    private static g: SpecialAction

    private actions: Record<SpecialAction.Actions, { check: () => boolean; callbacks: Record<string, () => void> }> = {
        // 'L1R1': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_TRIGGER) && ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_TRIGGER), lastActivated: 0, callbacks: {} },
        // 'L2R2': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_TRIGGER) && ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_TRIGGER), lastActivated: 0, callbacks: {} },
        LSP: { check: () => ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_STICK), callbacks: {} },
        RSP: { check: () => ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_STICK), callbacks: {} },
        R2: { check: () => ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_TRIGGER), callbacks: {} },
        L2: { check: () => ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_TRIGGER), callbacks: {} },
    }

    constructor() {
        /* in prestart */
        SpecialAction.g = this
        CrossedEyes.initPoststart.push(() => {
            ig.game.addons.preUpdate.push(this)
        })
    }

    onPreUpdate() {
        /* run by ig.game.addons.preUpdate */
        for (const actionName of Object.keysT(this.actions)) {
            const action = this.actions[actionName]
            if (action.check()) {
                Object.values(action.callbacks).forEach(c => c())
            }
        }
    }

    static setListener(type: SpecialAction.Actions, name: string, callback: () => void) {
        SpecialAction.g.actions[type].callbacks[name] = callback
    }
}

export namespace SpecialAction {
    export type Actions = 'LSP' | 'RSP' | 'R2' | 'L2'
}
