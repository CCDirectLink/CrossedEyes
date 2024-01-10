import { MenuOptions } from '../optionsManager'
import CrossedEyes, { PauseListener } from '../plugin'
import { SoundManager, stopHandle } from '../sound-manager'
import { SpecialAction } from '../special-action'
import { TextGather } from '../tts/gather-text'
import { AimAnalyzer, isAiming } from './aim-analyze'
import { AnalyzableHintMenu } from './analyzable-override'
import { ClimbableTerrainHints } from './climbable-terrain'
import { EnemyHintMenu } from './enemy-override'
import { HBounceBlock, HBounceSwitch } from './hints/bounce-puzzles'
import { HDestructible } from './hints/destructible'
import { HEnemy, HEnemyCounter } from './hints/enemy'
import { HMultiHitSwitch, HOneTimeSwitch, HSwitch } from './hints/switches'
import { HDoor, HElevator, HTeleportField, HTeleportGround } from './hints/tprs'
import { HWalls } from './hints/walls'
import { NPCHintMenu } from './npc-override'

export const HintTypes = ['All', 'NPC', 'Enemy', 'Interactable', 'Climbable', 'Selected'] as const /* "Analyzable" category integrated into "Interactable" */
export const HintSubTypes = ['Puzzle', 'Plants'] as const

export interface HintData {
    name: string
    description: string
}
export interface Hint {
    entryName: string

    getDataFromEntity<T extends ig.Entity>(entity: T): HintData
}

export type ReqHintEntry = { entity: ig.Entity; nameGui: { description: sc.TextGui; title: sc.TextGui; description2: string | null } }

export type HintUnion = sc.QUICK_MENU_TYPES.Hints | sc.QUICK_MENU_TYPES.NPC | sc.QUICK_MENU_TYPES.Enemy | sc.QUICK_MENU_TYPES.Analyzable | sc.QUICK_MENU_TYPES.Climbable

export class HintSystem implements PauseListener {
    static g: HintSystem

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
        HElevator,
        HWalls,
        HDestructible,
        HEnemy,
        HEnemyCounter,
    ]
    filterType: (typeof HintTypes)[number] | 'Hints' = 'All'
    filterHintType: (typeof HintSubTypes)[number] | undefined
    filterList: string[]
    filterIndex: number = 0
    currentSelectIndex: number = 0
    prevEntry: sc.QuickMenuTypesBase | undefined

    quickMenuAnalysisInstance!: sc.QuickMenuAnalysis

    activeHints: ({ hint: ReqHintEntry; handle?: ig.SoundHandle; muted?: boolean } | undefined)[] = [undefined]

    focusMode: boolean = false /* false for position based (default behaviour), true for index based */
    sorted!: sc.QuickMenuTypesBase[]

    deactivateHint(index: number) {
        const e = this.activeHints[index]
        if (e) {
            stopHandle(e.handle)
            TextGather.g.interrupt()
            if (index == 0) {
                const mutedIndex = this.activeHints.findIndex(e => e?.muted)
                if (mutedIndex != -1) {
                    this.activeHints[mutedIndex]!.muted = false
                }
                this.activeHints[0] = undefined
                SpecialAction.setListener('LSP', 'hintDescription', () => {})
                SpecialAction.setListener('R2', 'hintDescription', () => {})
            } else {
                this.activeHints.splice(index, 1)
                this.activeHints[0] && (this.activeHints[0]!.muted = false)
            }
        }
    }

    deactivateHintAll(e: ig.Entity) {
        this.activeHints
            .filter(o => o?.hint.entity == e)
            .map(o => this.activeHints.indexOf(o))
            .forEach(i => this.deactivateHint(i))
    }

    activateHint(index: number, hint: ReqHintEntry, playSound: boolean = true, dontPauseInQuickAnalysis: boolean = false) {
        this.deactivateHint(index)
        if (!MenuOptions.hints) {
            return
        }
        if (index == -1) {
            index = this.activateHint.length
        }

        let handle: ig.SoundHandle | undefined
        if (index == 0) {
            const foundIndex: number = this.activeHints.findIndex(e => e?.hint.entity.uuid == hint.entity.uuid)
            if (foundIndex != -1) {
                const sameHint = this.activeHints[foundIndex]!
                handle = sameHint.handle
                sameHint.muted = true
            }
        }
        if (playSound) {
            handle = new ig.Sound(SoundManager.sounds.hint, MenuOptions.hintsVolume).play(true)
            this.updateHintSound(hint, handle)
            handle.play()
            handle.dontPauseInQuickAnalysis = dontPauseInQuickAnalysis
        }
        this.activeHints[index] = { hint, handle }

        const isToggled = this.activeHints.slice(1).findIndex(e => e?.hint.entity.uuid == hint.entity.uuid) >= 0
        MenuOptions.ttsEnabled && TextGather.g.speakI(`${isToggled ? 'selected, ' : ''}${hint.nameGui.title.text}`)
        SpecialAction.setListener('LSP', 'hintDescription', () => {
            MenuOptions.ttsEnabled && TextGather.g.speakI(hint.nameGui.description.text)
        })
        if (hint.nameGui.description2) {
            SpecialAction.setListener('R2', 'hintDescription', () => {
                MenuOptions.ttsEnabled && sc.quickmodel.isQuickCheck() && TextGather.g.speakI(hint.nameGui.description2)
            })
        }
    }

    updateHintSound(hint: ReqHintEntry, handle: ig.SoundHandle) {
        const dist = Vec3.distance(ig.game.playerEntity.coll.pos, hint.entity.coll.pos)
        const maxRange = 16 * 30
        const diff = maxRange - dist
        const range = diff > maxRange * 0.4 ? maxRange : Math.floor(dist * 2)
        handle.setEntityPosition(hint.entity, ig.ENTITY_ALIGN.CENTER, null, range, ig.SOUND_RANGE_TYPE.CIRULAR)
        if (handle._nodePosition) {
            handle._nodePosition.refDistance = 0.1 * handle.pos!.range
            handle._nodePosition.maxDistance = handle.pos!.range
        }
        handle._setPosition()

        const yDiff = ig.game.playerEntity.coll.pos.z - hint.entity.coll.pos.z
        const playbackSpeed = Math.min(1.5, Math.max(0.5, 1 - yDiff / 160))
        handle._speed = playbackSpeed
        handle._nodeSource && (handle._nodeSource.bufferNode.playbackRate.value = playbackSpeed)
    }

    pause() {
        for (let i = 0; i < this.activateHint.length; i++) {
            this.deactivateHint(i)
        }
    }

    selectNextHint(add: number) {
        const pPos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
        const sorted: sc.QuickMenuTypesBase[] = (this.sorted = this.quickMenuAnalysisInstance.entities
            .filter(e => e)
            .sort((a, b) => Vec2.distance(a.entity.getCenter(), pPos) - Vec2.distance(b.entity.getCenter(), pPos)))
        this.currentSelectIndex += add
        if (this.currentSelectIndex == sorted.length) {
            this.currentSelectIndex = 0
        } else if (this.currentSelectIndex == -1) {
            this.currentSelectIndex = sorted.length - 1
        }
        const entry: sc.QuickMenuTypesBase = sorted[this.currentSelectIndex]

        if (entry) {
            this.focusMode = true
            sc.quickmodel.cursorMoved = true
            sc.quickmodel.cursor = Vec2.createC(entry.hook.pos.x + entry.hook.size.x / 2, entry.hook.pos.y + entry.hook.size.y / 2)
            this.quickMenuAnalysisInstance.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, true)

            this.prevEntry && this.prevEntry.focusLost()
            this.prevEntry = entry
        }
    }

    updateFilter() {
        if (this.filterIndex < 0) {
            this.filterIndex = this.filterList.length - 1
        } else if (this.filterIndex >= this.filterList.length) {
            this.filterIndex = 0
        }
        const e = this.filterList[this.filterIndex]
        if (e == 'All' || HintTypes.includes(e as any)) {
            this.filterType = e as this['filterType']
            this.filterHintType = undefined
        } else {
            this.filterType = 'Hints'
            this.filterHintType = e as this['filterHintType']
        }
        this.currentSelectIndex = 0
        if (this.quickMenuAnalysisInstance) {
            this.quickMenuAnalysisInstance.show()
            this.quickMenuAnalysisInstance.enter()
        }
    }

    private checkHintTogglePressed() {
        if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2 /* x */)) {
            const ahint = this.activeHints[0]
            if (ahint) {
                const foundIndex: number = this.activeHints.slice(1).findIndex(e => e?.hint.entity.uuid == ahint.hint.entity.uuid)
                if (foundIndex == -1) {
                    this.activateHint(-1, ahint.hint, true, true)
                    ahint.muted = true
                } else {
                    this.deactivateHint(foundIndex + 1)
                    MenuOptions.ttsEnabled && TextGather.g.speakI('unselected')
                }
            }
        }
    }

    constructor() {
        /* runs in prestart */
        CrossedEyes.pauseables.push(this)
        HintSystem.g = this
        this.filterList = [...HintTypes, ...HintSubTypes]
        this.filterList.slice(this.filterList.indexOf('Hints'))
        this.updateFilter()

        this.registeredTypes = {}
        for (const type of this.puzzleTypes) {
            const inst: Hint = new type()
            this.registeredTypes[inst.entryName] = inst
        }

        const self = this
        sc.QuickMenuTypesBase.inject({
            isMouseOver() {
                if (
                    MenuOptions.hints &&
                    sc.quickmodel.isQuickCheck() &&
                    !ig.interact.isBlocked() &&
                    this.focusable &&
                    sc.quickmodel.isDeviceSynced() &&
                    ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD &&
                    !sc.quickmodel.cursorMoved &&
                    self.focusMode &&
                    self.sorted.indexOf(this) != self.currentSelectIndex
                ) {
                    return false
                }
                return this.parent()
            },
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
                self.activateHint(0, this)
            },
            focusLost() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
                self.deactivateHint(0)
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
            init(getText: () => [string, string, string | null]) {
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
                    const data: HintData = self.registeredTypes[settings.hintName!].getDataFromEntity(settings.entity)
                    return [data.name, data.description, null]
                })
            },
        })

        let justEnteredQuickMenu = false
        sc.GameModel.inject({
            enterQuickMenu() {
                justEnteredQuickMenu = true
                const ret: boolean = this.parent()
                justEnteredQuickMenu = false
                return ret
            },
        })
        ig.SoundHandleWebAudio.inject({
            pause(noFadeOut) {
                if (!(this.dontPauseInQuickAnalysis && justEnteredQuickMenu)) {
                    this.parent(noFadeOut)
                }
            },
        })

        ig.Game.inject({
            update() {
                this.parent()
                for (const e of self.activeHints) {
                    if (e && e.handle) {
                        if (e.muted && e.handle._volume != 0) {
                            e.handle._volume = 0
                            e.handle._nodeSource && (e.handle._nodeSource!.gainNode.gain.value = 0)
                        } else if (!e.muted && e.handle._volume == 0) {
                            e.handle._volume = 1
                            e.handle._nodeSource && (e.handle._nodeSource!.gainNode.gain.value = 1)
                        }
                        self.updateHintSound(e.hint, e.handle)
                    }
                }
            },
            preloadLevel(mapName) {
                this.parent(mapName)
                self.activeHints.forEach(h => stopHandle(h?.handle))
                self.activeHints = [undefined]
            },
        })
        sc.QuickMenuAnalysis.inject({
            init() {
                this.parent()
                self.quickMenuAnalysisInstance = this
            },
            update() {
                this.parent()
                if (sc.quickmodel.cursorMoved) {
                    self.focusMode = false
                }
            },
        })

        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (AimAnalyzer.g.aimAnnounceOn && isAiming()) {
                    self.checkHintTogglePressed()
                }
            },
        })
        sc.QuickMenuAnalysis.inject({
            update(...args) {
                if (sc.quickmodel.isQuickCheck() && MenuOptions.hints) {
                    let add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                    if (add != 0) {
                        self.selectNextHint(add)
                    }

                    let filterAdd = ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? 1 : 0
                    if (filterAdd) {
                        self.filterIndex += filterAdd
                        self.updateFilter()
                        MenuOptions.ttsEnabled && TextGather.g.speakI(`${self.filterList[self.filterIndex]}`)
                    } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP)) {
                        MenuOptions.ttsEnabled && TextGather.g.speakI(`Hint filter: ${self.filterList[self.filterIndex]}`)
                    }

                    self.checkHintTogglePressed()
                }
                return this.parent(...args)
            },
            createHint(entity, filter = true) {
                // ((entity.isQuickMenuVisible && entity.isQuickMenuVisible()) || ig.EntityTools.isInScreen(entity, 0))
                if (entity && entity.getQuickMenuSettings) {
                    if (filter && self.filterType == 'Selected' && self.activeHints.findIndex(e => e?.hint.entity.uuid == entity.uuid) == -1) {
                        return
                    }
                    if (filter && self.filterType == 'Interactable' && !('interactEntry' in entity)) {
                        return
                    }

                    const sett = entity.getQuickMenuSettings() as sc.QuickMenuTypesBaseSettings
                    if (
                        !sett.disabled &&
                        sc.QUICK_MENU_TYPES[sett.type] &&
                        (!filter || self.filterType == 'All' || self.filterType == 'Selected' || self.filterType == 'Interactable' || sett.type == self.filterType)
                    ) {
                        sett.entity = entity
                        const ins = new sc.QUICK_MENU_TYPES[sett.type](sett.type, sett, this.focusContainer)

                        if (filter && sett.type == 'Hints' && ins instanceof sc.QUICK_MENU_TYPES.Hints && self.filterHintType && sett.hintType != self.filterHintType) {
                            return
                        }
                        return ins
                    }
                }
            },
            populateHintList() {
                this.entities.length = 0
                for (const entity of ig.game.shownEntities) {
                    const hint = this.createHint(entity)
                    if (hint) {
                        this.entities.push(hint)
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
                self.currentSelectIndex = -1
            },
        })

        ig.EVENT_STEP.SET_PLAYER_CORE.inject({
            start() {
                /* disallow disabling quick menu */
                if (MenuOptions.hints && this.core == sc.PLAYER_CORE.QUICK_MENU && this.value == false) {
                    return
                }
                this.parent()
            },
        })

        /* enable the quick menu on preset load (doing this manually for ms solar preset was very annyoing */
        sc.SavePreset?.inject({
            load(...args) {
                this.parent(...args)
                setTimeout(() => sc.model.player.setCore(sc.PLAYER_CORE.QUICK_MENU, true), 2000)
            },
        })

        new NPCHintMenu()
        new EnemyHintMenu()
        new AnalyzableHintMenu()
        new ClimbableTerrainHints()
    }
}
