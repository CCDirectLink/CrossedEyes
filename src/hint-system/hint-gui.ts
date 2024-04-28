import { Lang } from '../lang-manager'
import { Hint, HintData, HintSystem } from './hint-system'

declare global {
    namespace sc {
        namespace QUICK_MENU_TYPES {
            interface Hints extends sc.QuickMenuTypesBase {
                nameGui: sc.HintsMenu
            }
            interface HintsConstructor extends ImpactClass<Hints> {
                new (type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen): Hints
            }
            var Hints: HintsConstructor
        }

        interface BasicHintMenu extends ig.BoxGui {
            getText: () => [string, string, string | null]
            ninepatch: ig.NinePatch
            title: sc.TextGui
            description: sc.TextGui
            description2: string | null

            setPosition(this: this, hook: ig.GuiHook, e: ig.Entity): void
            getCenter(this: this, a: ig.GuiHook): number
            updateData(this: this): number
        }
        interface BasicHintMenuConstructor extends ImpactClass<BasicHintMenu> {
            new (getText: () => ReturnType<BasicHintMenu['getText']>): BasicHintMenu
        }
        var BasicHintMenu: BasicHintMenuConstructor

        interface HintsMenu extends sc.BasicHintMenu {
            hintClass?: Hint
        }
        interface HintsMenuConstructor extends ImpactClass<HintsMenu> {
            new (settings: sc.QuickMenuTypesBaseSettings): HintsMenu
        }
        var HintsMenu: HintsMenuConstructor
    }
}

sc.QUICK_MENU_TYPES.Hints = sc.QuickMenuTypesBase.extend({
    init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
        this.parent(type, settings, screen)
        this.setIconColor(HintSystem.customColors[settings.hintType!] ?? sc.ANALYSIS_COLORS.ORANGE)
        // this.showType = sc.SHOW_TYPE.DEFAULT
        this.showType = sc.SHOW_TYPE.INSTANT

        this.nameGui = new sc.HintsMenu(settings)
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
        this.parent()
        this.nameGui.doStateTransition('DEFAULT')

        HintSystem.g.activateHint(this.entity)
    },
    focusLost() {
        this.parent()
        this.nameGui.doStateTransition('HIDDEN')
        HintSystem.g.deactivateHint(this.entity)
    },
    alignGuiPosition() {
        this.parent()
        this.nameGui.setPosition(this.hook, this.entity)
    },
})

sc.BasicHintMenu = ig.BoxGui.extend({
    ninepatch: new ig.NinePatch('media/gui/menu.png', {
        width: 8,
        height: 8,
        left: 8,
        top: 8,
        right: 8,
        bottom: 8,
        offsets: { default: { x: 432, y: 304 }, flipped: { x: 456, y: 304 } },
    }),
    transitions: {
        HIDDEN: { state: { alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
        DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
    },
    init(getText: (prependConditionalText?: boolean) => [string, string, string | null]) {
        this.getText = getText
        const width = this.updateData()
        this.parent(width, 17 + this.description.textBlock.size.y)
        this.addChildGui(this.title)
        this.addChildGui(this.description)
        this.doStateTransition('HIDDEN', true)
    },
    updateData(): number {
        const [title, desc1, desc2] = this.getText()
        this.title = new sc.TextGui(title, { font: sc.fontsystem.smallFont })
        this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
        this.title.setPos(0, 2)
        const width = Math.max(127, 20 + this.title.textBlock.size.x)
        this.description = new sc.TextGui(desc1, { font: sc.fontsystem.tinyFont, maxWidth: width - 7 })
        this.description.setPos(5, 15)

        this.description2 = desc2
        return width
    },
    setPosition(hook: ig.GuiHook, e: ig.Entity) {
        if (hook.screenCoords) {
            const pos: Vec2 = Vec2.createC(0, 0)
            pos.x = hook.screenCoords.x + hook.size.x / 2 - this.hook.size.x / 2
            pos.y = hook.screenCoords.y - (e.coll.size.y + 14)
            if (pos.x < 0) {
                pos.x = pos.x * -1
                pos.x = pos.x + 1
            } else if (pos.x + this.hook.size.x > ig.system.width) {
                pos.x = ig.system.width - (pos.x + this.hook.size.x + 1)
            } else {
                pos.x = 0
            }
            if (pos.y < 0) {
                pos.y = e.coll.size.y + 6
            } else {
                pos.y = -(e.coll.size.y + 14)
            }
            pos.y += 55
            this.setPos(this.getCenter(hook) + pos.x, hook.pos.y + pos.y)
        }
    },
    getCenter(a: ig.GuiHook) {
        return a.pos.x + a.size.x / 2 - this.hook!.size.x / 2
    },
})
sc.HintsMenu = sc.BasicHintMenu.extend({
    init(settings: sc.QuickMenuTypesBaseSettings) {
        this.parent(() => {
            this.hintClass = HintSystem.g.registeredTypes[settings.hintName!]
            let data: HintData = this.hintClass.getDataFromEntity(settings.entity, settings)
            if (!this.hintClass.disableWalkedOn && settings.entity.isPlayerStandingOnMe) {
                data = {
                    name: Lang.hints.onItTopTemplate.supplant({
                        rest: data.name,
                    }),
                    description: data.description,
                }
            }
            return [data.name, data.description, null]
        })
    },
})
