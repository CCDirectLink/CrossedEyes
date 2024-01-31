import { PlayerTraceResult } from './environment/loudjump'
import { HintUnion, HintSubTypes } from './hint-system/hint-system'
import { SoundGlossaryEntryP } from './tutorial/sound-glossary'

export {}

export type ClimbableMenuSettings = sc.QuickMenuTypesBaseSettings & {
    pos?: Vec3
    size?: Vec3
}

// why am i doing this
// prettier-ignore
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

// prettier-ignore
type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never

// prettier-ignore
type Push<T extends any[], V> = [...T, V];

// prettier-ignore
export type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

declare global {
    interface Object {
        fromEntries<T, K extends string | number | symbol>(entries: [K, T][]): Record<K, T>
    }
    interface String {
        interpolate(...values: (string | number)[]): string
        supplant(vars: ValidTextLike[] | Record<string, ValidTextLike>): string
    }
    type ValidTextLike = string | { toString(): string }
    namespace ig {
        interface SoundHandleBase {
            pos: null | {
                point: Vec2
                point3d: Vec3 /* only thing modified */
                entity: ig.Entity | null
                align: ig.ENTITY_ALIGN | null
                offset: null
                range: number
                rangeType: ig.SOUND_RANGE_TYPE
            }
            dontPauseInQuickAnalysis?: boolean
            path: string
        }
        interface SoundWebAudio {
            origVolume?: number
        }

        // @ts-expect-error
        type SoundHandle = ig.SoundHandleWebAudio // | ig.SoundHandleDefault
        // @ts-expect-error
        type Sound = ig.SoundWebAudio
        // @ts-expect-error
        type SoundConstructor = SoundWebAudioConstructor
        // @ts-expect-error
        var Sound: SoundConstructor

        namespace ENTITY {
            interface WallBlocker {
                parentWall: ig.ENTITY.WallBase
            }
            interface Destructible {
                desType: keyof typeof sc.DESTRUCTIBLE_TYPE
            }
        }
        interface Entity {
            uuid: string
            entitySoundInited?: boolean
        }
        interface MessageAreaGui {
            skip(this: this, nextMsg?: boolean): void
        }

        namespace ACTION_STEP {
            interface PLAY_SOUND {
                origVolume: number
            }
        }

        var isdemo: boolean
    }
    namespace sc {
        interface RowButtonGroup {
            elements: (sc.ButtonGui & { optionRow: sc.OptionRow })[][]
        }
        namespace QUICK_MENU_TYPES {
            interface Hints extends sc.QuickMenuTypesBase {
                nameGui: sc.HintsMenu
            }
            interface HintsConstructor extends ImpactClass<Hints> {
                new (type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen): Hints
            }
            var Hints: HintsConstructor

            interface NPC {
                nameGui: sc.NPCHintMenu
            }
            interface Enemy {
                entity: ig.ENTITY.Enemy
                nameGui: sc.EnemyHintMenu
            }
            interface Analyzable {
                nameGui: sc.AnalyzableHintMenu
            }

            interface Climbable extends sc.QuickMenuTypesBase {
                nameGui: sc.ClimbableMenu
            }
            interface ClimbableConstructor extends ImpactClass<Climbable> {
                new (type: string, settings: ClimbableMenuSettings, screen: sc.QuickFocusScreen): Climbable
            }
            var Climbable: ClimbableConstructor
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

        interface HintsMenu extends sc.BasicHintMenu {}
        interface HintsMenuConstructor extends ImpactClass<HintsMenu> {
            new (settings: sc.QuickMenuTypesBaseSettings): HintsMenu
        }
        var HintsMenu: HintsMenuConstructor

        interface NPCHintMenu extends sc.BasicHintMenu {}
        interface NPCHintMenuConstructor extends ImpactClass<NPCHintMenu> {
            new (text: string, settings: sc.QuickMenuTypesBaseSettings): NPCHintMenu
        }
        var NPCHintMenu: NPCHintMenuConstructor

        interface EnemyHintMenu extends sc.BasicHintMenu {}
        interface EnemyHintMenuConstructor extends ImpactClass<EnemyHintMenu> {
            new (enemy: ig.ENTITY.Enemy): EnemyHintMenu
        }
        var EnemyHintMenu: EnemyHintMenuConstructor

        interface AnalyzableHintMenu extends sc.BasicHintMenu {}
        interface AnalyzableHintMenuConstructor extends ImpactClass<AnalyzableHintMenu> {
            new (text: string, settings: sc.QuickMenuTypesBaseSettings): AnalyzableHintMenu
        }
        var AnalyzableHintMenu: AnalyzableHintMenuConstructor

        interface ClimbableMenu extends sc.BasicHintMenu {}
        interface ClimbableMenuConstructor extends ImpactClass<ClimbableMenu> {
            new (settings: ClimbableMenuSettings): ClimbableMenu
        }
        var ClimbableMenu: ClimbableMenuConstructor

        interface QuickMenuTypesBaseSettings {
            hintName?: string
            hintType?: (typeof HintSubTypes)[number]
            dontEmitSound?: boolean
        }

        interface QuickMenuAnalysis {
            createHint(this: this, entity: ig.Entity, filter?: boolean): HintUnion | undefined
            populateHintList(this: this): void
        }

        interface CrossedEyesPositionPredictor extends ig.ActorEntity {
            rfc: {
                on: boolean
                timer: number
                startTime: number
            }
            rfcr: PlayerTraceResult

            runPlayerTrace(this: this, seconds: number, vel: number, fps?: number): PlayerTraceResult
            stopRunning(this: this): void
            checkQuickRespawn(this: this): void
        }
        interface CrossedEyesPositionPredictorConstructor extends ImpactClass<CrossedEyesPositionPredictor> {
            new (x: number, y: number, z: number, settings: ig.Entity.Settings): CrossedEyesPositionPredictor
        }
        var CrossedEyesPositionPredictor: CrossedEyesPositionPredictorConstructor

        interface MapInteractEntry {
            stateUpdate?: boolean

            customUpdate(this: this): void
        }

        interface SideMessageBoxGui {
            beepSound: ig.Sound | null
        }

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

        namespace SoundGlossary {
            interface List extends sc.ListTabbedPane {}
            interface ListConstructor extends ImpactClass<List> {
                new (): List
            }
            var List: ListConstructor

            interface Menu extends sc.ListInfoMenu {
                list: sc.SoundGlossary.List
                info: sc.SoundGlossary.InfoBox
                isEntrySelected: boolean
                currentSelectedButton: sc.SoundGlossary.ListEntry
                isSoundOn: boolean

                toggleSoundSelected(this: this, button: sc.SoundGlossary.ListEntry): void
                getContiniousId(this: this, entry: SoundGlossaryEntryP): string
                startSound(this: this): void
                stopSound(this: this): void
                updateSound(this: this): void
            }
            interface MenuConstructor extends ImpactClass<Menu> {
                new (): Menu
            }
            var Menu: MenuConstructor

            interface ListEntry extends sc.ListBoxButton {
                entry: SoundGlossaryEntryP
                title: sc.TextGui

                keepButtonPressed(this: this, state: boolean): void
            }
            interface ListEntryConstructor extends ImpactClass<ListEntry> {
                new (entry: SoundGlossaryEntryP): ListEntry
            }
            var ListEntry: ListEntryConstructor

            interface InfoBox extends ig.BoxGui {
                gfx: ig.Image
                ninepatch: ig.NinePatch
                title: sc.TextGui
                description: sc.TextGui

                show(this: this): void
                hide(this: this): void
                setData(this: this, entry: SoundGlossaryEntryP): void
            }
            interface InfoBoxConstructor extends ImpactClass<InfoBox> {
                new (): InfoBox
            }
            var InfoBox: InfoBoxConstructor
        }
    }
}
