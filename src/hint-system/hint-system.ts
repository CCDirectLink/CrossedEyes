import { EntityPoint, MapPoint } from 'cc-map-util/src/pos'
import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
import CrossedEyes from '../plugin'
import { SoundManager } from '../sound-manager'
import { SpecialAction } from '../special-action'
import { interrupt, speakI, speakIC } from '../tts/gather-text'
import { AimAnalyzer, isAiming } from './aim-analyze'
import { EnemyHintMenu } from './enemy-override'
import { HAnalyzable } from './hints/analyzable'
import { HBounceBlock, HBounceSwitch } from './hints/bounce-puzzles'
import { HChest } from './hints/chest'
import { HClimbableTerrain } from './hints/climbable-terrain'
import { HDestructible } from './hints/destructible'
import { HEnemy, HEnemyCounter } from './hints/enemy'
import { HProp } from './hints/prop'
import { HDynamicPlatform, HOLPlatform } from './hints/rhombus-puzzle'
import { HMultiHitSwitch, HOneTimeSwitch, HSwitch } from './hints/switches'
import { HDoor, HElevator, HTeleportField, HTeleportGround } from './hints/tprs'
import { HWalls } from './hints/walls'
import { NPCHintMenu } from './npc-override'
import type { Selection } from 'cc-blitzkrieg/types/selection'
import { isVecInRectArr } from 'cc-map-util/src/rect'

export const HintTypes = ['All', 'Enemy', 'NPC', 'Interactable', 'Selected'] as const
export const HintSubTypes = ['Puzzle', 'Plants', 'Chests', 'Climbable', 'Analyzable'] as const

export interface HintData {
    name: string
    description: string
}
export interface Hint {
    entryName: string
    disableWalkedOn?: boolean

    getDataFromEntity<T extends ig.Entity>(entity: T, settings: sc.QuickMenuTypesBaseSettings): HintData
}

export type ReqHintEntry = { entity: ig.Entity; nameGui: { description: sc.TextGui; title: sc.TextGui; description2: string | null } }

export type HintUnion = sc.QUICK_MENU_TYPES.Hints | sc.QUICK_MENU_TYPES.NPC | sc.QUICK_MENU_TYPES.Enemy

export class HintSystem {
    static g: HintSystem

    static get continiousConfig(): SoundManager.ContiniousSettings {
        return {
            paths: ['hint'],
            changePitchWhenBehind: true,
            pathsBehind: ['hintLP'],
            getVolume: () => Opts.hintsVolume,
        }
    }

    static customColors: { [key in (typeof HintSubTypes)[number]]?: sc.ANALYSIS_COLORS } = {}

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
        HOLPlatform,
        HChest,
        HClimbableTerrain,
        HProp,
        HAnalyzable,
        HDynamicPlatform,
    ]
    filterType: (typeof HintTypes)[number] | 'Hints' = 'All'
    filterHintType: (typeof HintSubTypes)[number] | undefined
    filterList: string[]
    filterIndex: number = 0
    currentSelectIndex: number = 0
    prevEntry: sc.QuickMenuTypesBase | undefined
    filterInSelection: boolean = false

    quickMenuAnalysisInstance!: sc.QuickMenuAnalysis

    focusMode: boolean = false /* false for position based (default behaviour), true for index based */
    sorted!: sc.QuickMenuTypesBase[]

    /* HE stands for Hint Entity */
    selectedHE: ig.Entity[] = []
    focusedHE?: ig.Entity

    private getContId(e: ig.Entity) {
        if (!e?.uuid) throw new Error('undefined uuid')
        return `hint_${e.uuid}`
    }

    private getHintFromEntity(e: ig.Entity): HintUnion {
        let hint = this.quickMenuAnalysisInstance.entities.find(h => h.entity.uuid == e.uuid)
        if (!hint) {
            this.quickMenuAnalysisInstance.populateHintList()
            hint = this.quickMenuAnalysisInstance.entities.find(h => h.entity.uuid == e.uuid)
        }
        return hint as HintUnion
    }

    deactivateHint(e: ig.Entity | undefined) {
        if (e && !(this.focusedHE == e && this.selectedHE.includes(e)) && SoundManager.stopCondinious(this.getContId(e))) {
            interrupt()
            SpecialAction.setListener('LSP', 'hintDescription', () => {})
            SpecialAction.setListener('R2', 'hintDescription', () => {})

            if (this.focusedHE == e) {
                this.focusedHE = undefined
            }
        }
    }

    activateHint(e: ig.Entity, primary: boolean = true) {
        if (primary) this.deactivateHint(this.focusedHE)
        else if (!this.selectedHE.includes(e)) this.selectedHE.push(e)

        const id = this.getContId(e)
        let entry = SoundManager.continious[id]
        if (!entry) entry = SoundManager.continious[id] = HintSystem.continiousConfig
        const hint = this.getHintFromEntity(e)
        if (!hint) return

        const isSelected = this.selectedHE.includes(e)
        speakIC((isSelected ? Lang.hints.focusedSelected : Lang.hints.focused).supplant({ hintTitle: hint.nameGui.title.text! }))

        SpecialAction.setListener('LSP', 'hintDescription', () => {
            speakIC(hint.nameGui.description.text!)
        })
        if (hint.nameGui.description2) {
            SpecialAction.setListener('R2', 'hintDescription', () => {
                sc.quickmodel.isQuickCheck() && speakIC(hint.nameGui.description2!)
            })
        }

        if (primary) this.focusedHE = e
    }

    private updateHintSound(e: ig.Entity) {
        const config = SoundManager.continious[this.getContId(e)]
        if (!('paths' in config)) throw new Error('invalid pickContiniousSettingsPath settings: paths not included')
        const handle = config.handle!
        const dist = Vec3.distance(ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER), e.getAlignedPos(ig.ENTITY_ALIGN.CENTER))
        const maxRange = 16 * 30
        const diff = maxRange - dist
        const range = diff > maxRange * 0.4 ? maxRange : Math.floor(dist * 2)
        handle.setEntityPosition(e, ig.ENTITY_ALIGN.CENTER, null, range, ig.SOUND_RANGE_TYPE.CIRULAR)
        if (handle._nodePosition) {
            handle._nodePosition.refDistance = 0.1 * handle.pos!.range
            handle._nodePosition.maxDistance = handle.pos!.range
        }
        handle._setPosition()

        const yDiff = ig.game.playerEntity.coll.pos.z - e.coll.pos.z
        const playbackSpeed = Math.min(1.5, Math.max(0.5, 1 - yDiff / 160))
        handle._speed = playbackSpeed
        handle._nodeSource && (handle._nodeSource.bufferNode.playbackRate.value = playbackSpeed)

        handle.dontPauseInQuickAnalysis = this.selectedHE.includes(e)
    }

    private selectNextHint(add: number) {
        const pPos: Vec3 = ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER)
        const sorted: HintUnion[] = (this.sorted = this.quickMenuAnalysisInstance.entities
            .filter(e => e)
            .sort(
                (a, b) =>
                    Vec2.distance((a.entity as ig.Entity).getAlignedPos(ig.ENTITY_ALIGN.CENTER), pPos) -
                    Vec2.distance((b.entity as ig.Entity).getAlignedPos(ig.ENTITY_ALIGN.CENTER), pPos)
            ) as HintUnion[])

        this.currentSelectIndex += add
        if (this.currentSelectIndex == sorted.length) {
            this.currentSelectIndex = 0
        } else if (this.currentSelectIndex < 0) {
            this.currentSelectIndex = sorted.length - 1
        }
        const entry: HintUnion = sorted[this.currentSelectIndex]

        if (entry) {
            this.focusMode = true
            sc.quickmodel.cursorMoved = true
            sc.quickmodel.cursor = Vec2.createC(entry.hook.pos.x + entry.hook.size.x / 2, entry.hook.pos.y + entry.hook.size.y / 2)
            this.quickMenuAnalysisInstance.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, true)

            this.prevEntry && this.prevEntry.focusLost()
            this.prevEntry = entry
        }
    }

    private updateFilter() {
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
        if (this.focusedHE && !this.quickMenuAnalysisInstance.createHint(this.focusedHE)) {
            this.deactivateHint(this.focusedHE)
        }
    }

    private checkHintTogglePressed() {
        if (ig.gamepad.isButtonPressed(ig.BUTTONS.FACE2 /* x */)) {
            if (this.focusedHE) {
                const foundHEI = this.selectedHE.findIndex(e => e.uuid == this.focusedHE!.uuid)
                if (foundHEI != -1) {
                    this.selectedHE.splice(foundHEI, 1)
                    speakIC(Lang.hints.unselected)
                } else {
                    this.activateHint(this.focusedHE, false)
                }
            }
        }
    }

    private groundEntrySet(e: ig.Entity) {
        if (Opts.tts) {
            const hint = this.getHintFromEntity(e)
            if (hint && hint instanceof sc.QUICK_MENU_TYPES.Hints && !hint.nameGui.hintClass?.disableWalkedOn) {
                const title = Lang.hints.walkedOntoTemplate.supplant({
                    rest: hint.nameGui.getText()[0],
                })
                speakI(title)
            }
        }
        e.isPlayerStandingOnMe = true
    }
    private groundEntryUnset(e: ig.Entity) {
        e.isPlayerStandingOnMe = false
        if (!Opts.tts) return
        const hint = this.getHintFromEntity(e)
        if (hint && hint instanceof sc.QUICK_MENU_TYPES.Hints && !hint.nameGui.hintClass?.disableWalkedOn) {
            speakI(Lang.hints.walkedOff)
        }
    }

    constructor() {
        /* runs in prestart */
        CrossedEyes.initPoststarters.push(this)
        HintSystem.g = this
        this.filterList = [...HintTypes, ...HintSubTypes]
        this.filterList.slice(this.filterList.indexOf('Hints'))
        this.updateFilter()

        this.registeredTypes = {}
        for (const type of this.puzzleTypes) {
            const inst: Hint = new type()
            this.registeredTypes[inst.entryName] = inst
        }

        SoundManager.continiousCleanupFilters.push('hint')

        const self = this
        sc.QuickMenuTypesBase.inject({
            isMouseOver() {
                if (
                    Opts.hints &&
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
                self.activateHint(this.entity)
            },
            focusLost() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
                self.deactivateHint(this.entity)
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
                    this.hintClass = self.registeredTypes[settings.hintName!]
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
                if (!Opts.hints || (CrossedEyes.isPaused && !sc.quickmodel.visible)) return
                for (const e of [self.focusedHE, ...self.selectedHE]) {
                    if (!e) continue
                    const id = self.getContId(e)
                    SoundManager.handleContiniousEntry(id, e.getAlignedPos(ig.ENTITY_ALIGN.CENTER), 1, 0, SoundManager.getAngleVecToPlayer(e))
                    self.updateHintSound(e)

                    if (e.getQuickMenuSettings!().disabled) {
                        self.deactivateHint(e)
                    }
                }
            },
            preloadLevel(mapName) {
                this.parent(mapName)
                self.selectedHE = []
                self.focusedHE = undefined
            },
        })
        sc.QuickMenuAnalysis.inject({
            init() {
                this.parent()
                self.quickMenuAnalysisInstance = this
            },
            update() {
                this.parent()
                if (sc.quickmodel.cursorMoved) self.focusMode = false
            },
        })

        let prevGroundEntity: ig.Entity | false = false
        ig.ENTITY.Player.inject({
            update() {
                this.parent()
                if (!Opts.hints) return
                if (AimAnalyzer.g.aimAnalyzeOn && isAiming()) {
                    self.checkHintTogglePressed()
                }
                const groundEntry = ig.game.playerEntity.coll?._collData?.groundEntry
                if (!groundEntry) {
                    if (prevGroundEntity) {
                        self.groundEntryUnset(prevGroundEntity)
                        prevGroundEntity = false
                    }
                } else if (groundEntry.entity !== prevGroundEntity) {
                    if (prevGroundEntity) self.groundEntryUnset(prevGroundEntity)
                    self.groundEntrySet(groundEntry.entity)
                    prevGroundEntity = groundEntry.entity
                }
            },
        })

        sc.QuickMenuAnalysis.inject({
            update(...args) {
                if (sc.quickmodel.isQuickCheck() && Opts.hints) {
                    let add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                    if (add != 0) {
                        self.selectNextHint(add)
                    }

                    let filterAdd = ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_LEFT) ? -1 : ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_RIGHT) ? 1 : 0
                    if (filterAdd) {
                        self.filterIndex += filterAdd
                        self.updateFilter()
                        speakIC(`${self.filterList[self.filterIndex]}`)
                    } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_UP)) {
                        speakIC(`${Lang.hints.hintFilter}: ${self.filterList[self.filterIndex]}`)
                    } else if (ig.gamepad.isButtonPressed(ig.BUTTONS.DPAD_DOWN)) {
                        self.filterInSelection = !self.filterInSelection
                        speakIC(self.filterInSelection ? Lang.hints.puzzleFilterOn : Lang.hints.puzzleFilterOff)
                        self.updateFilter()
                    }

                    self.checkHintTogglePressed()
                }
                return this.parent(...args)
            },
            createHint(entity, filter = true) {
                // ((entity.isQuickMenuVisible && entity.isQuickMenuVisible()) || ig.EntityTools.isInScreen(entity, 0))
                if (entity && entity.getQuickMenuSettings) {
                    if (filter && self.filterType == 'Selected' && self.selectedHE.findIndex(e => e.uuid == entity.uuid) == -1) return

                    if (
                        filter &&
                        self.filterType == 'Interactable' &&
                        (!sc.mapInteract.entries.find(o => o.entity.uuid == entity.uuid) || (entity instanceof ig.ENTITY.NPC && entity.xenoDialog))
                    )
                        return

                    if (filter && self.filterInSelection) {
                        const sel: Selection = blitzkrieg.sels.puzzle.inSelStack.peek()
                        const mapPoint = EntityPoint.fromVec(entity.getAlignedPos(ig.ENTITY_ALIGN.CENTER)).to(MapPoint)
                        if (sel && !isVecInRectArr(mapPoint, sel.bb)) return
                    }

                    const sett = entity.getQuickMenuSettings() as sc.QuickMenuTypesBaseSettings

                    if (sett.type == 'Analyzable') {
                        /* redirect */
                        sett.type = 'Hints'
                        sett.hintType = 'Analyzable'
                        sett.hintName = 'Analyzable'
                    }

                    if (
                        !sett.disabled &&
                        sc.QUICK_MENU_TYPES[sett.type] &&
                        (!filter || self.filterType == 'All' || self.filterType == 'Selected' || self.filterType == 'Interactable' || sett.type == self.filterType)
                    ) {
                        sett.entity = entity
                        const ins = new sc.QUICK_MENU_TYPES[sett.type](sett.type, sett, this.focusContainer) as HintUnion

                        if (filter && sett.type == 'Hints' && ins instanceof sc.QUICK_MENU_TYPES.Hints && self.filterHintType && sett.hintType != self.filterHintType)
                            return

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
                for (const e of this.entities as sc.QuickMenuTypesBase[]) {
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
                if (Opts.hints && this.core == sc.PLAYER_CORE.QUICK_MENU && this.value == false) {
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
    }

    initPoststart() {
        const selEvent = () => this.filterInSelection && this.quickMenuAnalysisInstance.populateHintList()
        blitzkrieg.sels.puzzle.walkInListeners.push(selEvent)
        blitzkrieg.sels.puzzle.walkOutListeners.push(selEvent)
    }
}
