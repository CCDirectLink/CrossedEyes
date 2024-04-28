import { HintSystem } from '../hint-system'

declare global {
    namespace sc {
        interface NPCHintMenu extends sc.BasicHintMenu {}
        interface NPCHintMenuConstructor extends ImpactClass<NPCHintMenu> {
            new (text: string, settings: sc.QuickMenuTypesBaseSettings): NPCHintMenu
        }
        var NPCHintMenu: NPCHintMenuConstructor

        namespace QUICK_MENU_TYPES {
            interface NPC {
                nameGui: sc.NPCHintMenu
            }
        }
    }
}
/* in prestart */
sc.NPCHintMenu = sc.BasicHintMenu.extend({
    init(origText: string, settings: sc.QuickMenuTypesBaseSettings) {
        const npc: ig.ENTITY.NPC = settings.entity as unknown as ig.ENTITY.NPC
        let text: string = ''
        let description: string = ''
        if (origText.startsWith('\\c[3]Trader')) {
            text = origText
            description = `Interactable ${origText}`
        } else if (npc.displayNameRandom) {
            text = `Random Player NPC named ${origText}`
            description = text
        } else if (origText == 'Random NPC') {
            text = 'Random NPC'
            description = 'Unnamed NPC'
        } else if (npc.character.data.name && ig.LangLabel.getText(npc.character.data.name) != 'MISSING LABEL') {
            const name = ig.LangLabel.getText(npc.character.data.name)
            text = `NPC ${name}`
            description = `do to`
        } else {
            text = 'Random NPC'
            description = 'Unnamed NPC'
        }
        this.parent(() => {
            return [text, description, null]
        })
    },
})
sc.QUICK_MENU_TYPES.NPC.inject({
    init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
        this.parent(type, settings, screen)
        let text: string = ''
        if (this.nameGui) {
            this.screen.subGuis.slice(this.screen.subGuis.indexOf(this.nameGui))
            this.screen.removeChildGui(this.nameGui)
            text = (this.nameGui as unknown as sc.QuickArrowBox).name.text!.toString()
        }
        if (!this.focusable) {
            this.focusable = true
            text = 'Random NPC'
        }
        this.nameGui = new sc.NPCHintMenu(text, settings)
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
