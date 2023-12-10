import CrossedEyes from './plugin'

export class SpecialAction {
    private static instance: SpecialAction

    private actions: Record<SpecialAction.Actions, { check: () => boolean, lastActivated: number, callbacks: Record<string, () => void> }> = {
        // 'L1R1': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_TRIGGER) && ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_TRIGGER), lastActivated: 0, callbacks: {} },
        // 'L2R2': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_TRIGGER) && ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_TRIGGER), lastActivated: 0, callbacks: {} },
        'LSP': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_STICK), lastActivated: 0, callbacks: {} },
        'RSP': { check: () => ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_STICK), lastActivated: 0, callbacks: {} },
    }

    constructor() { /* in prestart */
        SpecialAction.instance = this
        CrossedEyes.initPoststarters.push(this)
    }
    initPoststart() {
        ig.game.addons.preUpdate.push(this)
    }

    onPreUpdate() { /* run by ig.game.addons.preUpdate */
        for (const actionName of Object.keys(this.actions) as (SpecialAction.Actions)[]) {
            const action = this.actions[actionName]
            const active: boolean = action.check()
            if (active) {
                if (Date.now() - action.lastActivated > 30) {
                    Object.values(action.callbacks).forEach(c => c())
                }
                action.lastActivated = Date.now()
            }
        }
    }

    static setListener(type: SpecialAction.Actions, name: string, callback: () => void) {
        SpecialAction.instance.actions[type].callbacks[name] = callback
    }
}

export namespace SpecialAction {
    export type Actions = 'LSP' | 'RSP' //'L1R1' | 'L2R2'
}
