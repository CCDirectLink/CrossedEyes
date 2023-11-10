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
    }
    namespace sc {
        interface RowButtonGroup {
            elements: (ig.FocusGui & { optionRow: sc.OptionRow })[][]
        }
    }
}
