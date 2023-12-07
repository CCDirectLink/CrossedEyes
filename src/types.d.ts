import { HintTypes } from './hint-system/hint-system'
import { PlayerTraceResult } from './loudjump'
import { PuzzleElementsAnalysis } from './puzzle-analyze'
import { PuzzleExtensionData } from './puzzle-analyze/puzzle-analyze'

export { }

declare global {
    namespace ig {
        interface SoundHandleBase {
            pos: null | {
                point: Vec2
                point3d: Vec3, /* only thing modified */
                entity: ig.Entity | null,
                align: ig.ENTITY_ALIGN | null,
                offset: null,
                range: number
                rangeType: ig.SOUND_RANGE_TYPE
            }
        }

        type SoundHandle = ig.SoundHandleWebAudio // | ig.SoundHandleDefault

        namespace ENTITY {
            interface WallBlocker {
                parentWall: ig.ENTITY.WallBase
            }
        }
        interface Entity {
            uuid: string
            playAtSoundHandle: ig.SoundHandleWebAudio
        }
    }
    namespace sc {
        interface RowButtonGroup {
            elements: (ig.FocusGui & { optionRow: sc.OptionRow })[][]
        }
        namespace QUICK_MENU_TYPES {
            interface Hints extends sc.QuickMenuTypesBase {
                nameGui: sc.HintsMenu
            }
            interface HintsConstructor extends ImpactClass<Hints> {
                new(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen): Hints
            }
            var Hints: HintsConstructor

            interface NPC {
                nameGui: sc.NPCHintMenu
            }
        }
        interface BasicHintMenu extends ig.BoxGui {
            getText: () => [string, string]
            ninepatch: ig.NinePatch
            title: sc.TextGui
            description: sc.TextGui

            setPosition(this: this, hook: ig.GuiHook, e: ig.Entity): void
            getCenter(this: this, a: ig.GuiHook): number
            updateData(this: this): number
        }
        interface BasicHintMenuConstructor extends ImpactClass<BasicHintMenu> {
            new(getText: () => [string, string]): BasicHintMenu
        }
        var BasicHintMenu: BasicHintMenuConstructor

        interface HintsMenu extends sc.BasicHintMenu { }
        interface HintsMenuConstructor extends ImpactClass<HintsMenu> {
            new(settings: sc.QuickMenuTypesBaseSettings): HintsMenu
        }
        var HintsMenu: HintsMenuConstructor

        interface NPCHintMenu extends sc.BasicHintMenu { }
        interface NPCHintMenuConstructor extends ImpactClass<NPCHintMenu> {
            new(text: string, settings: sc.QuickMenuTypesBaseSettings): NPCHintMenu
        }
        var NPCHintMenu: NPCHintMenuConstructor

        interface QuickMenuTypesBaseSettings {
            hintName?: string
            hintType?: HintTypes
        }

        interface QuickMenuAnalysis {
            populateHintList(this: this): void
        }

        interface CrossedEyesPositionPredictor extends ig.ActorEntity {
            rfc: {
                on: boolean
                timer: number
                startTime: number
            }
            rfcr: PlayerTraceResult

            runPlayerTrace(this: this, seconds: number, vel: number, fps: number = 30): PlayerTraceResult
            stopRunning(this: this): void
            checkQuickRespawn(this: this): void
        }
        interface CrossedEyesPositionPredictorConstructor extends ImpactClass<CrossedEyesPositionPredictor> {
            new(x: number, y: number, z: number, settings: ig.Entity.Settings): CrossedEyesPositionPredictor
        }
        var CrossedEyesPositionPredictor: CrossedEyesPositionPredictorConstructor
    }
}

