import { PuzzleElementsAnalysis } from './puzzle-analyze'
import { PuzzleExtensionData } from './puzzle-analyze/puzzle-analyze'

export {}

declare global {
    namespace ig {
        interface SoundHandleBase  {
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
            interface Enemy {
                playAtSoundHandle: ig.SoundHandleWebAudio
            }
        }
        interface Entity {
            uuid: string
        }
    }
    namespace sc {
        interface RowButtonGroup {
            elements: (ig.FocusGui & { optionRow: sc.OptionRow })[][]
        }
        namespace QUICK_MENU_TYPES {
            interface PuzzleElements extends sc.QuickMenuTypesBase {
                nameGui: sc.PuzzleElementsMenu
            }
            interface PuzzleElementsConstructor extends ImpactClass<PuzzleElements> {
                new (type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen): PuzzleElements
            }
            var PuzzleElements: PuzzleElementsConstructor
        }
        
        interface PuzzleElementsMenu extends ig.BoxGui {
            settings: sc.QuickMenuTypesBaseSettings
            ninepatch: ig.NinePatch
            title: sc.TextGui
            description: sc.TextGui

            setPosition(this: this, hook: ig.GuiHook, e: ig.Entity): void
            getCenter(this: this, a: ig.GuiHook): number
            updateData(this: this): void
        }
        interface PuzzleElementsMenuConstructor extends ImpactClass<PuzzleElementsMenu> {
            new (settings: sc.QuickMenuTypesBaseSettings): PuzzleElementsMenu;
        }
        var PuzzleElementsMenu: PuzzleElementsMenuConstructor;

        interface QuickMenuTypesBaseSettings {
            puzzleType?: string
        }
    }
}
