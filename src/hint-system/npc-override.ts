import { TextGather } from '../tts/gather-text'
import { HintSystem } from './hint-system'

export function overrideNPCHint() {
    sc.NPCHintMenu = sc.BasicHintMenu.extend({
        init(origText: string, settings: sc.QuickMenuTypesBaseSettings) {
            const npc: ig.ENTITY.NPC = settings.entity as unknown as ig.ENTITY.NPC
            let text: string = ''
            let description: string = ''
            if (npc.displayNameRandom) {
                text = `Random Player NPC named ${origText}`
                description = text
            // @ts-expect-error
            } else if (npc.character.data.name) {

            }
            // console.log(npc.displayName, npc.displayNameRandom, npc.character.data.name)
            this.parent(() => {
                return [text, description]
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
            HintSystem.activeHint(this)
        },
        focusLost() {
            this.nameGui.doStateTransition('HIDDEN')
            !TextGather.g.ignoreInterrupt && HintSystem.deactivateHint()
        },
        alignGuiPosition() {
            this.parent()
            this.nameGui.setPosition(this.hook, this.entity)
        },
    })
}
