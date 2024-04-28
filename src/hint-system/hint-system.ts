import { EntityPoint, MapPoint } from 'cc-map-util/src/pos'
import { Lang } from '../lang-manager'
import { Opts } from '../plugin'
import CrossedEyes from '../plugin'
import { SoundManager } from '../sound-manager'
import { SpecialAction } from '../special-action'
import { HAnalyzable } from './hints/analyzable'
import { HBounceBlock, HBounceSwitch } from './hints/bounce-puzzles'
import { HChest } from './hints/chest'
import { HClimbableTerrain } from './hints/climbable-terrain'
import { HDestructible } from './hints/destructible'
import { HEnemy, HEnemyCounter } from './hints/enemy'
import { HProp } from './hints/prop'
import { HBallChanger, HDynamicPlatform, HOLPlatform } from './hints/rhombus-puzzle'
import { HMultiHitSwitch, HOneTimeSwitch, HSwitch } from './hints/switches'
import { HDoor, HElevator, HTeleportField, HTeleportGround } from './hints/tprs'
import { HWalls } from './hints/walls'
import { isVecInRectArr } from 'cc-map-util/src/rect'
import { interrupt, speakIC } from '../tts/gather/api'
import type { PuzzleSelection } from 'cc-blitzkrieg/types/puzzle-selection'
import type { Selection } from 'cc-blitzkrieg/types/selection'
import { BattleSelection } from 'cc-blitzkrieg/types/battle-selection'

declare global {
    namespace sc {
        interface QuickMenuTypesBaseSettings {
            hintName?: RegisteredHintTypes
            hintType?: (typeof HintSubTypes)[number]
            dontEmitSound?: boolean
            aimBounceWhitelist?: boolean
        }

        interface QuickMenuAnalysis {
            entities: HintUnion[]

            createHint(this: this, entity: Nullable<ig.Entity> | undefined, filter?: boolean): HintUnion | undefined
            populateHintList(this: this): void
        }
    }
}

const HintTypes = ['All', 'Enemy', 'NPC', 'Interactable', 'Selected'] as const
const HintSubTypes = ['Puzzle', 'Plants', 'Chests', 'Climbable', 'Analyzable'] as const

export interface HintData {
    name: string
    description: string
}
export interface HintBase {
    entryName: string
    disableWalkedOn?: boolean

    getDataFromEntity<T extends ig.Entity>(entity: T, settings: sc.QuickMenuTypesBaseSettings): HintData
}

export interface Hint extends HintBase {
    entryName: RegisteredHintTypes
}

export type HintUnion = sc.QUICK_MENU_TYPES.Hints | sc.QUICK_MENU_TYPES.NPC | (Omit<sc.QUICK_MENU_TYPES.Enemy, 'entity'> & { entity: ig.Entity })

type GetReturns<T> = T extends new (...args: unknown[]) => infer E ? E : never
type RegisteredHintTypes = GetReturns<(typeof puzzleTypes)[number]>['entryName']

const puzzleTypes = [
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
    HBallChanger,
] as const satisfies (new () => HintBase)[]

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

    registeredTypes!: Record<string, Hint>
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

    getHintFromEntity(e: ig.Entity): HintUnion {
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
        if (this.focusedHE && !this.quickMenuAnalysisInstance.createHint(this.focusedHE)) {
            this.deactivateHint(this.focusedHE)
        }
    }

    private getCurrentSelectionToFilterIn(): Selection | undefined {
        const psel: PuzzleSelection = blitzkrieg.sels.puzzle.inSelStack.peek()
        if (psel) {
            if (psel.data.recordLog && psel.data.recordLog.steps.length > 0) {
                const solution = blitzkrieg.PuzzleSelectionManager.getPuzzleSolveCondition(psel)
                if (!solution) return psel
                if (ig.vars.get(solution[0].substring(1)) !== solution[1]) return psel
            } else return psel
        }

        if (sc.model.isCombatMode() || ig.game.mapName == 'cargo-ship.room2' /* the only fight where you dont enter combat mode (stupid mouse bots) */) {
            const bsel: BattleSelection = blitzkrieg.sels.battle.inSelStack.peek()
            if (bsel) return bsel
        }
    }

    private registerHintTypes() {
        this.registeredTypes = {}
        for (const type of puzzleTypes) {
            const inst: Hint = new type()
            this.registeredTypes[inst.entryName] = inst
        }
    }

    constructor() {
        /* runs in prestart */
        CrossedEyes.initPoststart.push(() => this.initPoststart())
        HintSystem.g = this
        this.filterList = [...HintTypes, ...HintSubTypes]
        this.filterList.slice(this.filterList.indexOf('Hints'))
        this.updateFilter()

        this.registerHintTypes()

        SoundManager.continiousCleanupFilters.push('hint')

        const self = this

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
                let i = 0
                for (const e of [self.focusedHE, ...self.selectedHE]) {
                    if (!e) continue
                    const id = self.getContId(e)
                    SoundManager.handleContiniousEntry(id, e.getAlignedPos(ig.ENTITY_ALIGN.CENTER), 1, 0, SoundManager.getAngleVecToPlayer(e))
                    self.updateHintSound(e)

                    if (e._killed || e.getQuickMenuSettings!().disabled) {
                        if (i > 0) self.selectedHE.erase(e)
                        self.deactivateHint(e)
                    }
                    i++
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

        sc.QuickMenuAnalysis.inject({
            createHint(entity, filter = true) {
                if (entity && entity.getQuickMenuSettings) {
                    if (filter && self.filterType == 'Selected' && self.selectedHE.findIndex(e => e.uuid == entity.uuid) == -1) return

                    if (
                        filter &&
                        self.filterType == 'Interactable' &&
                        (!sc.mapInteract.entries.find(o => o.entity.uuid == entity.uuid) || (entity instanceof ig.ENTITY.NPC && entity.xenoDialog))
                    )
                        return

                    if (filter && self.filterInSelection) {
                        const sel = self.getCurrentSelectionToFilterIn()
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

        import('./hint-gui')
        import('./ground-hint')
        import('./input/next-hint')
        import('./input/selected')
        import('./input/filter')

        import('../misc/quick-menu-enabler')
        import('./override/npc')
        import('./override/enemy')
    }

    initPoststart() {
        const selEvent = () => this.filterInSelection && this.quickMenuAnalysisInstance.populateHintList()
        blitzkrieg.sels.puzzle.walkInListeners.push(selEvent)
        blitzkrieg.sels.puzzle.walkOutListeners.push(selEvent)
        blitzkrieg.sels.battle.walkInListeners.push(selEvent)
        blitzkrieg.sels.battle.walkOutListeners.push(selEvent)
    }
}
