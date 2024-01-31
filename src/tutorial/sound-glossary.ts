import { Lang } from '../lang-manager'
import { SoundManager } from '../sound-manager'
import { SpecialAction } from '../special-action'
import { getReadableText, speakArgsC, speakC } from '../tts/gather-text'
import { TuplifyUnion } from '../types'
import { sc_MENU_SUBMENU_CROSSEDEYESHUD_SOUND_GLOSSARY } from './crossedeyes-hud'
import { getSoundGlossaryEntries } from './sound-glossary-entries'

export namespace SoundGlossary {
    export interface Entry {
        config: SoundManager.ContiniousSettings
        range?: number
        dirs?: [string, Vec2][]
        forceOmnidirectional?: boolean
    }
    export interface EntryP extends Entry {
        id: string
        category: string
    }
}

export class SoundGlossary {
    private glossary = getSoundGlossaryEntries()
    private categories: TuplifyUnion<keyof typeof this.glossary> = Object.keys(this.glossary) as any

    private getLangDataFromEntry(entry: SoundGlossary.EntryP) {
        // @ts-expect-error
        return Lang.menu.soundglossary.entries[entry.category][entry.id]
    }

    private setCategoriesAndIds() {
        const glossary = this.glossary as Record</*category */ string, Record</* id */ string, SoundGlossary.Entry>>
        for (const category in glossary) {
            const entries = glossary[category]
            for (const id in entries) {
                const lang = entries[id] as SoundGlossary.EntryP
                lang.id = id
                lang.category = category
            }
        }
    }
    constructor() {
        /* in prestart */
        this.setCategoriesAndIds()
        const self = this

        sc.SoundGlossary = {} as any
        sc.SoundGlossary.InfoBox = ig.BoxGui.extend({
            gfx: new ig.Image('media/gui/basic.png'),
            ninepatch: new ig.NinePatch('media/gui/menu.png', {
                width: 2,
                height: 8,
                left: 27,
                top: 21,
                right: 27,
                bottom: 3,
                offsets: { default: { x: 456, y: 244 }, focus: { x: 576, y: 432 } },
            }),
            init() {
                this.parent(281, 265)
                this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP)
                this.hook.transitions = {
                    DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE },
                    HIDDEN: { state: { alpha: 0, offsetX: -(this.hook.size.x / 2) }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                }
                this.title = new sc.TextGui('')
                this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
                this.title.setPos(0, 4)
                this.addChildGui(this.title)

                this.description = new sc.TextGui('', { font: sc.fontsystem.smallFont, maxWidth: 261 })
                this.description.setSize(261, 221)
                this.description.setPos(10, 40)
                this.addChildGui(this.description)
            },
            show() {
                this.doStateTransition('DEFAULT')
            },
            hide() {
                this.doStateTransition('HIDDEN')
            },
            setData(entry: SoundGlossary.EntryP) {
                const lang = self.getLangDataFromEntry(entry)
                this.title.setText(lang.name)
                this.description.setSize(261, 0)
                this.description.setText(getReadableText(lang.description))
            },
        })

        const width = 250
        sc.SoundGlossary.ListEntry = sc.ListBoxButton.extend({
            init(entry: SoundGlossary.EntryP) {
                this.entry = entry
                const lang = self.getLangDataFromEntry(entry)
                this.parent(lang.name, width - 3, 73)
            },
            focusGained() {
                this.parent()
                sc.Model.notifyObserver(sc.menu, sc.MENU_EVENT.SYNO_CHANGED_TAB, this.entry)
                const lang = self.getLangDataFromEntry(this.entry)
                speakC(`${lang.name}`)
                SpecialAction.setListener('LSP', 'soundglossary', () => {
                    speakC(`${lang.description}`)
                })
            },
            keepButtonPressed(state: boolean) {
                this.keepPressed = state
                this.setPressed(state)
                this.button.keepPressed = state
                this.button.setPressed(state)
            },
        })

        sc.SoundGlossary.List = sc.ListTabbedPane.extend({
            init() {
                this.parent(false)
                this.setSize(width, 262)
                this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP)
                this.setPivot(width, 262)
                this.setPanelSize(width, 243)
                this.hook.transitions = {
                    DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                    HIDDEN: { state: { alpha: 0, offsetX: 218 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                    HIDDEN_EASE: { state: { alpha: 0, offsetX: 218 }, time: 0.2, timeFunction: KEY_SPLINES.EASE },
                }
                for (let i = 0; i < self.categories.length; i++) {
                    const category = self.categories[i]
                    this.addTab(category, i, { type: i })
                }
            },
            show() {
                this.parent()

                this.setTab(0, true, { skipSounds: true })
                const firstTabButton = this.tabGroup.elements[0][0] as unknown as sc.ItemTabbedBox.TabButton
                firstTabButton.setPressed(true)
                this._prevPressed = firstTabButton
                this.resetButtons(firstTabButton)
                this.rearrangeTabs()

                ig.interact.setBlockDelay(0.2)
                this.doStateTransition('DEFAULT')
            },
            hide() {
                this.parent()
                this.doStateTransition('HIDDEN')
            },
            onTabButtonCreation(key: string, _index: number, settings) {
                const button = new sc.ItemTabbedBox.TabButton(` ${key}`, `${key}`, 85)
                button.textChild.setPos(7, 1)
                button.setPos(0, 2)
                button.setData({ type: settings.type })
                this.addChildGui(button)
                return button
            },
            onTabPressed(_button, wasSame) {
                if (!wasSame) {
                    sc.BUTTON_SOUND.submit.play()
                    return true
                }
            },
            onLeftRightPress() {
                sc.BUTTON_SOUND.submit.play()
                return { skipSounds: true }
            },
            onContentCreation(index, settings) {
                this.currentList && this.currentList.clear()
                this.currentGroup && this.currentGroup.clear()
                this.parent(index, settings)
                const orig_doButtonTraversal = this.currentGroup.doButtonTraversal
                this.currentGroup.doButtonTraversal = function (this: sc.ButtonGroup, inputRegained: boolean) {
                    if (menu.isEntrySelected) {
                        sc.control.menuConfirm() && this.invokeCurrentButton()
                        orig_doButtonTraversal.bind(this)(true) /* block list navigation */
                        menu.updateSound()
                    } else orig_doButtonTraversal.bind(this)(inputRegained)
                }
            },
            onCreateListEntries(list, buttonGroup, type, _sort) {
                list.clear()
                buttonGroup.clear()
                const entries = self.glossary[self.categories[type]]
                for (const entryId in entries) {
                    const entry = entries[entryId as keyof typeof entries]
                    const button = new sc.SoundGlossary.ListEntry(entry)
                    list.addButton(button)
                }
            },
            onListEntryPressed(button) {
                sc.BUTTON_SOUND.submit.play()
                sc.Model.notifyObserver(sc.menu, sc.MENU_EVENT.SYNOP_BUTTON_PRESS, button)
            },
        })

        let menu: sc.SoundGlossary.Menu
        sc.SoundGlossary.Menu = sc.ListInfoMenu.extend({
            isEntrySelected: false,
            init() {
                menu = this
                this.parent(new sc.SoundGlossary.List(), new sc.SoundGlossary.InfoBox(), true)
                this.doStateTransition('DEFAULT')
            },
            modelChanged(model, message, data) {
                if (model == sc.menu) {
                    if (message == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                        this.info.setData(data)
                    } else if (message == sc.MENU_EVENT.SYNOP_BUTTON_PRESS) {
                        const button = data as sc.SoundGlossary.ListEntry
                        this.currentSelectedButton = button
                        if (button) this.toggleSoundSelected(button)
                    }
                }
            },
            showMenu() {
                speakArgsC(Lang.menu.soundglossary.firstOpen.supplant({ category: self.categories[0] }))
                this.parent()
            },
            hideMenu() {
                this.parent()
                this.isEntrySelected = false
                this.currentSelectedButton?.keepButtonPressed(false)
                this.stopSound()
                SpecialAction.setListener('LSP', 'soundglossary', () => {})
            },
            createHelpGui() {
                if (!this.helpGui) {
                    this.helpGui = new sc.HelpScreen(this, Lang.menu.soundglossary.helpTitle, Lang.menu.soundglossary.helpDescription, () => {}, true)
                    this.helpGui.hook.zIndex = 15e4
                    this.helpGui.hook.pauseGui = true
                }
            },
            toggleSoundSelected(button: sc.SoundGlossary.ListEntry) {
                this.isEntrySelected = !this.isEntrySelected
                button.keepButtonPressed(this.isEntrySelected)
                if (this.isEntrySelected) menu.startSound()
                else menu.stopSound()
            },
            getContiniousId(entry) {
                return `soundglossary_${entry.name}`
            },
            startSound() {
                const entry: SoundGlossary.Entry = this.currentSelectedButton.entry
                const id = this.getContiniousId(entry)
                let config: SoundManager.ContiniousSettings
                config = entry.config
                config.condition = undefined
                config.getVolume ??= () => 1
                SoundManager.continious[id] = config
                this.isSoundOn = true
            },
            stopSound() {
                this.isSoundOn = false
                const entry: SoundGlossary.Entry = this.currentSelectedButton?.entry
                if (!entry) return
                const id = this.getContiniousId(entry)
                SoundManager.stopCondinious(id)
            },
            updateSound() {
                if (!this.isSoundOn) return
                const entry: SoundGlossary.Entry = this.currentSelectedButton.entry
                let pos: Vec3 = Vec3.create()
                let dir: Vec2 = Vec2.create()
                let range: number = 5 * 16
                if (entry.config.changePitchWhenBehind || entry.forceOmnidirectional) {
                    const dirVec: Vec2 = Vec2.createC(ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_X), ig.gamepad.getAxesValue(ig.AXES.LEFT_STICK_Y))
                    if (Vec2.isZero(dirVec)) {
                        dir = Vec2.create()
                    } else if (entry.dirs) {
                        let smallestDist: number = 1000
                        let smallestDistConf!: [string, Vec2]
                        for (const conf of entry.dirs) {
                            const dist = Vec2.distance(dirVec, Vec2.normalize(Vec2.create(conf[1])))
                            if (dist < smallestDist) {
                                smallestDist = dist
                                smallestDistConf = conf
                            }
                        }
                        dir = smallestDistConf[1]
                    } else {
                        dir = Vec2.create(dirVec)
                        Vec2.mulC(dir, 16)
                    }
                    entry.range && (range = entry.range)
                    pos = Vec3.createC(dir.x, dir.y, 0)
                }
                const id = this.getContiniousId(entry)
                Vec3.add(pos, ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER))
                if (entry.config.changePitchWhenBehind) {
                    const faceVec: Vec2 = Vec2.createC(ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_X), ig.gamepad.getAxesValue(ig.AXES.RIGHT_STICK_Y))
                    SoundManager.handleContiniousEntry(id, pos, range, 0, dir, faceVec, Vec2.isZero(faceVec))
                } else {
                    SoundManager.handleContiniousEntry(id, pos, range, 0)
                }
            },
        })

        // @ts-expect-error uhhhhhh enum moment
        sc.MENU_SUBMENU.CROSSEDEYESHUD_SOUNDGLOSSARY = sc_MENU_SUBMENU_CROSSEDEYESHUD_SOUND_GLOSSARY
        sc.SUB_MENU_INFO[sc.MENU_SUBMENU.CROSSEDEYESHUD_SOUNDGLOSSARY] = {
            Clazz: sc.SoundGlossary.Menu,
            name: 'crossedeyeshud_soundglossary',
        }
    }
}
