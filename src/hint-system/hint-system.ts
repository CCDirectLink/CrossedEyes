import { MenuOptions } from '../options'
import CrossedEyes, { PauseListener } from '../plugin'
import { SoundManager } from '../sound-manager'
import { SpecialAction } from '../special-action'
import { TextGather } from '../tts/gather-text'
import { HBounceBlock, HBounceSwitch } from './hints/bounce-puzzles'
import { HDestructible } from './hints/destructible'
import { HEnemy } from './hints/enemy'
import { HMultiHitSwitch, HOneTimeSwitch, HSwitch } from './hints/switches'
import { HDoor, HTeleportField, HTeleportGround } from './hints/tprs'
import { HWalls } from './hints/walls'
import { NPCHintMenu } from './npc-override'

export const HintTypes = ['Puzzle', 'Plants'] as const

export interface HintData {
    name: string
    description: string
}
export interface Hint {
    entryName: string

    getDataFromEntity<T extends ig.Entity>(entity: T): HintData
}

let soundHandle: ig.SoundHandleWebAudio | undefined

export class HintSystem implements PauseListener {
    static deactivateHint() {
        if (soundHandle) {
            soundHandle.stop()
            soundHandle = undefined
            TextGather.g.interrupt()
            SpecialAction.setListener('LSP', 'hintDescription', () => { })
        }
    }
    static activeHint(hint: { entity: ig.Entity, nameGui: { description: sc.TextGui, title: sc.TextGui } }, playSound: boolean = true) {
        HintSystem.deactivateHint()
        const dist = Vec3.distance(ig.game.playerEntity.coll.pos, hint.entity.coll.pos)
        const maxRange = 16 * 30
        const diff = maxRange - dist
        const range = diff > maxRange * 0.4 ? maxRange : Math.floor(dist * 2)

        if (playSound) {
            const yDiff = ig.game.playerEntity.coll.pos.z - hint.entity.coll.pos.z
            const playbackSpeed = Math.min(1.5, Math.max(0.5, 1 - (yDiff / 160)))

            soundHandle = new ig.Sound(SoundManager.sounds.hint, 1).play(undefined, {
                speed: playbackSpeed
            })
            soundHandle.setEntityPosition(hint.entity, ig.ENTITY_ALIGN.CENTER, null, range, ig.SOUND_RANGE_TYPE.CIRULAR)
            soundHandle.play()
        }

        MenuOptions.ttsMenuEnabled && TextGather.g.speak(hint.nameGui.title.text)
        SpecialAction.setListener('LSP', 'hintDescription', () => {
            MenuOptions.ttsMenuEnabled && TextGather.g.speak(hint.nameGui.description.text)
        })
    }

    registeredTypes: Record<string, Hint>
    puzzleTypes: (new () => Hint)[] = [
        HBounceBlock,
        HBounceSwitch,
        HSwitch,
        HOneTimeSwitch,
        HMultiHitSwitch,
        HDoor,
        HTeleportField,
        HTeleportGround,
        HEnemy,
        HWalls,
        HDestructible,
    ]
    filterType: keyof typeof sc.QUICK_MENU_TYPES | 'All' = 'All'
    filterHintType: typeof HintTypes[number] | undefined
    filterList: string[]
    filterIndex: number = 0

    static quickMenuAnalysisInstance: sc.QuickMenuAnalysis

    pause() {
        HintSystem.deactivateHint()
    }

    setupGui() {
        const self = this

        let lastFocusedHintPos: Vec2 = Vec2.create()
        sc.QuickMenuTypesBase.inject({ /* fix issue where two hints can be focued at the same time */
            isMouseOver() {
                if (MenuOptions.puzzleEnabled && sc.quickmodel.isQuickCheck() && !ig.interact.isBlocked() && this.focusable &&
                    sc.quickmodel.isDeviceSynced() && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && !sc.quickmodel.cursorMoved) {

                    var a: ig.GuiHook = this.hook!
                    const pos: Vec2 = Vec2.createC(a.pos.x + Math.floor(a.size.x / 2), a.pos.y + Math.floor(a.size.y / 2))
                    if (Math.floor(Vec2.distance(sc.quickmodel.cursor, pos)) <= 10) {
                        if (Vec2.equal(lastFocusedHintPos, pos)) {
                            return false
                        }
                        lastFocusedHintPos = pos
                    }
                }
                return this.parent()
            }
        })

        sc.QUICK_MENU_TYPES.Hints = sc.QuickMenuTypesBase.extend({
            init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
                this.parent(type, settings, screen)
                this.setIconColor(sc.ANALYSIS_COLORS.ORANGE)
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
                HintSystem.activeHint(this)
            },
            focusLost() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
                !TextGather.g.ignoreInterrupt && HintSystem.deactivateHint()
            },
            alignGuiPosition() {
                this.parent()
                this.nameGui.setPosition(this.hook, this.entity)
            },
        })

        sc.BasicHintMenu = ig.BoxGui.extend({
            ninepatch: new ig.NinePatch("media/gui/menu.png", { width: 8, height: 8, left: 8, top: 8, right: 8, bottom: 8, offsets: { default: { x: 432, y: 304 }, flipped: { x: 456, y: 304 } } }),
            transitions: { HIDDEN: { state: { alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR }, DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE } },
            init(getText: () => [string, string]) {
                this.getText = getText
                const width = this.updateData()
                this.parent(width, 17 + this.description.textBlock.size.y)
                this.addChildGui(this.title)
                this.addChildGui(this.description)
                this.doStateTransition('HIDDEN', true)
            },
            updateData(): number {
                const [title, desc] = this.getText()
                this.title = new sc.TextGui(title, { font: sc.fontsystem.smallFont })
                this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
                this.title.setPos(0, 2)
                const width = Math.max(127, 20 + this.title.textBlock.size.x)
                this.description = new sc.TextGui(desc, { font: sc.fontsystem.tinyFont, maxWidth: width - 7 })
                this.description.setPos(5, 15)
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
                    const data: HintData = self.registeredTypes[settings.hintName!].getDataFromEntity(settings.entity)
                    return [data.name, data.description]
                })
            },
        })
    }

    updateFilter() {
        if (this.filterIndex < 0) {
            this.filterIndex = this.filterList.length - 1
        } else if (this.filterIndex >= this.filterList.length) {
            this.filterIndex = 0
        }
        const e = this.filterList[this.filterIndex]
        if (e == 'All' || Object.keys(sc.QUICK_MENU_TYPES).indexOf(e) >= 0) {
            this.filterType = e as this['filterType']
            this.filterHintType = undefined
        } else {
            this.filterType = 'Hints'
            this.filterHintType = e as this['filterHintType']
        }
        HintSystem.quickMenuAnalysisInstance?.populateHintList()
    }

    constructor() { /* runs in prestart */
        CrossedEyes.pauseables.push(this)
        this.filterList = ['All', ...Object.keys(sc.QUICK_MENU_TYPES), ...HintTypes]
        this.filterList.slice(this.filterList.indexOf('Hints'))
        this.updateFilter()

        this.registeredTypes = {}
        for (const type of this.puzzleTypes) {
            const inst: Hint = new type()
            this.registeredTypes[inst.entryName] = inst
        }

        this.setupGui()

        const self = this
        sc.QuickMenuAnalysis.inject({
            init() {
                this.parent()
                HintSystem.quickMenuAnalysisInstance = this
            }
        })

        let currentSelectIndex: number = -1
        let prevEntry: sc.QuickMenuTypesBase
        sc.QuickMenuAnalysis.inject({
            update(...args) {
                if (sc.quickmodel.currentState == sc.QUICK_MENU_STATE.CHECK && MenuOptions.puzzleEnabled) {
                    let add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 :
                        ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                    if (add != 0) {
                        const pPos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
                        const sorted: sc.QuickMenuTypesBase[] =
                            HintSystem.quickMenuAnalysisInstance.entities.filter(e => e)
                                .sort((a, b) => Vec3.distance(a.entity.coll.pos, pPos) - Vec3.distance(b.entity.coll.pos, pPos))
                        if (currentSelectIndex == -1) {
                            currentSelectIndex = 0
                        } else {
                            currentSelectIndex += add
                            if (currentSelectIndex == sorted.length) { currentSelectIndex = 0 }
                            else if (currentSelectIndex == -1) { currentSelectIndex = 0 }
                        }
                        const entry: sc.QuickMenuTypesBase = sorted[currentSelectIndex]

                        if (entry) {
                            sc.quickmodel.cursorMoved = true
                            sc.quickmodel.cursor = Vec2.createC(
                                entry.hook.pos.x + entry.hook.size.x / 2,
                                entry.hook.pos.y + entry.hook.size.y / 2,
                            )
                            this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, true)

                            prevEntry && prevEntry.focusLost()
                            prevEntry = entry
                        }
                    }

                    let filterAdd = ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ? -1 :
                        ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? 1 : 0
                    if (filterAdd) {
                        self.filterIndex += filterAdd
                        self.updateFilter()
                        MenuOptions.ttsEnabled && TextGather.g.speak(`${self.filterList[self.filterIndex]}`)
                    } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP)) {
                        MenuOptions.ttsEnabled && TextGather.g.speak(`Hint filter: ${self.filterList[self.filterIndex]}`)
                    }
                }
                return this.parent(...args)
            },
            populateHintList() {
                this.entities.length = 0
                for (const entity of ig.game.shownEntities) {
                    if (entity && entity.getQuickMenuSettings && ((entity.isQuickMenuVisible && entity.isQuickMenuVisible()) || ig.EntityTools.isInScreen(entity, 0))) {
                        const sett = entity.getQuickMenuSettings() as sc.QuickMenuTypesBaseSettings
                        if (!sett.disabled && sc.QUICK_MENU_TYPES[sett.type] && (self.filterType == 'All' || sett.type == self.filterType)) {
                            sett.entity = entity
                            const ins = new sc.QUICK_MENU_TYPES[sett.type](sett.type, sett, this.focusContainer)

                            if (sett.type == 'Hints' && ins instanceof sc.QUICK_MENU_TYPES.Hints &&
                                self.filterHintType && sett.hintType != self.filterHintType) { continue }
                            this.entities.push(ins)
                        }
                    }
                }
            },
            show() {
                this.iconContainer.removeAllChildren()
                this.entities.length = 0
                this.buttonGroup.clear()
                this.focusContainer.resetSubGuis()
                this.populateHintList()
                for (const e of this.entities) {
                    e.alignGuiPosition(0, 0)
                    this.iconContainer.addChildGui(e)
                    e.show()
                    this.buttonGroup.addFocusGui(e)
                }
                this.focusContainer.reset()
                this.doStateTransition('DEFAULT')
                currentSelectIndex = -1
            },
        })

        ig.EVENT_STEP.SET_PLAYER_CORE.inject({
            start() {
                /* enable the quick menu at the start of the game */
                if (MenuOptions.puzzleEnabled && this.core == sc.PLAYER_CORE.QUICK_MENU && this.value == false) {
                    return
                }
                this.parent()
            }
        })

        new NPCHintMenu()
    }
}
