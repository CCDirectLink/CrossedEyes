export class SpecialAction {
    private static instance: SpecialAction

    private l2r2LastActivated: number = 0
    private callbacks: Record<string, () => void> = {}

    constructor() { /* in prestart */
        SpecialAction.instance = this
    }
    initPoststart() {
        ig.game.addons.preUpdate.push(this)
    }

    onPreUpdate() { /* run by ig.game.addons.preUpdate */
        const l2r2 = ig.gamepad.isButtonDown(ig.BUTTONS.RIGHT_TRIGGER) && ig.gamepad.isButtonDown(ig.BUTTONS.LEFT_TRIGGER)
        if (l2r2) {
            if (Date.now() - this.l2r2LastActivated > 30) {
                Object.values(this.callbacks).forEach(c => c())
            }
            this.l2r2LastActivated = Date.now()
        }
    }

    static setListener(name: string, callback: () => void) {
        SpecialAction.instance.callbacks[name] = callback
    }
}
