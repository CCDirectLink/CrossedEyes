import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import CrossedEyes from '../../plugin'

declare global {
    namespace sc {
        interface PauseScreenGui {
            crossedEyesHudButton: sc.ButtonGui
        }
        enum MENU_SUBMENU {
            CROSSEDEYESHUD_MENU,
            CROSSEDEYESHUD_SOUNDGLOSSARY,
        }

        interface CrossedEyesHudMenu extends sc.BaseMenu {
            buttons: sc.ButtonGui[]
            buttonGroup: sc.ButtonGroup

            onBackButtonPress(this: this): void
        }
        interface CrossedEyesHudMenuConstructor extends ImpactClass<CrossedEyesHudMenu> {
            new (): CrossedEyesHudMenu
        }
        var CrossedEyesHudMenu: CrossedEyesHudMenuConstructor
    }
}

const sc_MENU_SUBMENU_CROSSEDEYESHUD_MENU = 385943 as const
export const sc_MENU_SUBMENU_CROSSEDEYESHUD_SOUND_GLOSSARY = 385944 as const

export class CrossedEyesHud {
    constructor() {
        CrossedEyes.initPoststart.push(() => {
            ig.lang.labels.sc.gui.menu['menu-titles'][sc.SUB_MENU_INFO[sc.MENU_SUBMENU.CROSSEDEYESHUD_MENU].name] = Lang.crossedeyes
        })
        /* in prestart */
        sc.CrossedEyesHudMenu = sc.BaseMenu.extend({
            gfx: new ig.Image('media/gui/menu.png'),
            init() {
                this.parent()
                this.hook.localAlpha = 0.0
                this.hook.pauseGui = true
                this.hook.size.x = ig.system.width
                this.hook.size.y = ig.system.height

                const buttonConfs: [string, sc.MENU_SUBMENU][] = [[Lang.menu.soundglossary.name, sc.MENU_SUBMENU.CROSSEDEYESHUD_SOUNDGLOSSARY]]

                this.buttonGroup = new sc.ButtonGroup()
                // sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)

                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this))

                const x = this.hook.size.x / 2 - sc.BUTTON_MENU_WIDTH / 2
                let y = this.hook.size.y / 2 - 24 * buttonConfs.length - 24 / 2

                this.buttons = []

                for (let i = 0; i < buttonConfs.length; i++) {
                    const buttonConf = buttonConfs[i]
                    const button = new sc.ButtonGui(buttonConf[0], sc.BUTTON_MENU_WIDTH)
                    button.onButtonPress = () => {
                        sc.menu.pushMenu(buttonConf[1])
                    }
                    this.buttonGroup.addFocusGui(button, 0, i)
                    button.setPos(x, y)
                    this.addChildGui(button)
                    this.buttons.push(button)
                    y += 24 + 4
                }

                this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER)
            },
            showMenu() {
                this.parent()
                sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
                this.doStateTransition('DEFAULT')
            },
            hideMenu() {
                this.parent()
                sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
                this.doStateTransition('HIDDEN')
            },
            onBackButtonPress() {
                sc.menu.popBackCallback()
                sc.menu.popMenu()
            },
        })

        // @ts-expect-error uhhhhhh enum moment
        sc.MENU_SUBMENU.CROSSEDEYESHUD_MENU = sc_MENU_SUBMENU_CROSSEDEYESHUD_MENU
        sc.SUB_MENU_INFO[sc.MENU_SUBMENU.CROSSEDEYESHUD_MENU] = {
            Clazz: sc.CrossedEyesHudMenu,
            name: 'crossedeyeshud_menu',
        }

        function addButton(this: sc.PauseScreenGui) {
            if (!Opts.hudVisible) return
            const b = this.crossedEyesHudButton
            b && this.removeChildGui(b)
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM)
            const buttonHeight = this.toTitleButton.hook.size.y
            b.setPos(3, this.resumeButton.hook.pos.y + buttonHeight + 4)
            this.addChildGui(b)

            if (this.buttonGroup.elements.length > 0 /* check if its called from updateButtons and not init */) {
                this.buttonGroup.addFocusGui(b, 0, this.hook.children.length - 2)
            }
        }

        sc.PauseScreenGui.inject({
            init() {
                this.parent()

                const b = (this.crossedEyesHudButton = new sc.ButtonGui(Lang.crossedeyes, sc.BUTTON_DEFAULT_WIDTH))
                b.onButtonPress = () => {
                    sc.menu.setDirectMode(true, sc.MENU_SUBMENU.CROSSEDEYESHUD_MENU)
                    sc.model.enterMenu(true)
                }
                addButton.bind(this)()
            },
            updateButtons(refocus) {
                /* hack to prevent focus resetting to the 0 index button since the crossedeyes button isnt added yet */
                const mouseGuiActiveBackup = ig.input.mouseGuiActive
                ig.input.mouseGuiActive = false
                let origFocusIndex = this.buttonGroup.current.y
                this.parent(refocus)
                ig.input.mouseGuiActive = mouseGuiActiveBackup

                addButton.bind(this)()
                /* restore previous index that was prevented in the above hack */
                origFocusIndex > this.buttonGroup.elements[0].length && (origFocusIndex = 0)
                refocus || (origFocusIndex = 0)
                if (ig.input.mouseGuiActive) {
                    this.buttonGroup.setCurrentFocus(0, origFocusIndex)
                    this.buttonGroup.unfocusCurrentButton()
                    this.optionsButton.unsetFocus()
                } else this.buttonGroup.focusCurrentButton(0, origFocusIndex, false, true)
            },
        })
    }
}
