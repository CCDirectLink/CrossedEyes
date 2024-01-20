import { HintSystem } from './hint-system'

export class AnalyzableHintMenu {
    constructor() {
        /* in prestart */
        sc.AnalyzableHintMenu = sc.BasicHintMenu.extend({
            init(origText: string, settings: sc.QuickMenuTypesBaseSettings) {
                let text = origText,
                    description = 'none'
                this.parent(() => {
                    return [text, description, null]
                })
            },
        })
        sc.QUICK_MENU_TYPES.Analyzable.inject({
            init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
                this.parent(type, settings, screen)
                let text: string = ''
                if (this.nameGui) {
                    this.screen.subGuis.slice(this.screen.subGuis.indexOf(this.nameGui))
                    this.screen.removeChildGui(this.nameGui)
                    text = (this.nameGui as unknown as sc.QuickArrowBox).name.text!.toString()
                }
                this.nameGui = new sc.AnalyzableHintMenu(text, settings)
                this.nameGui.setPivot(this.nameGui.hook.size.x / 2, 0)
                this.nameGui.hook.transitions = {
                    DEFAULT: { state: {}, time: 0.1, timeFunction: KEY_SPLINES.EASE },
                    HIDDEN: { state: { alpha: 0, scaleX: 0.3, offsetY: 8 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                }
                this.nameGui.doStateTransition('HIDDEN', true)
                this.screen.addSubGui(this.nameGui)
            },
            onAnalysisEnter() {
                this.nameGui.setPosition(this.hook, this.entity)
                this.parent()
            },
            onAnalysisExit() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
            },
            focusGained() {
                this.nameGui.doStateTransition('DEFAULT')
                HintSystem.g.activateHint(this.entity)
            },
            focusLost() {
                this.nameGui.doStateTransition('HIDDEN')
                HintSystem.g.deactivateHint(HintSystem.g.focusedHE)
            },
            alignGuiPosition() {
                this.parent()
                this.nameGui.setPosition(this.hook, this.entity)
            },
        })
    }
}
