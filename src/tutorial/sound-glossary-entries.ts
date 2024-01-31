import { EntityBeeper } from '../environment/entity-beeper'
import { InteractableHandler as InteractableHandler } from '../environment/interactables'
import { LoudJump } from '../environment/loudjump'
import { LoudWalls } from '../environment/loudwalls'
import { HintSystem } from '../hint-system/hint-system'
import { Opts } from '../options-manager'
import { SoundManager } from '../sound-manager'
import { SoundGlossaryEntry } from './sound-glossary'

export function getSoundGlossaryEntries() {
    const loudjumpDirs: [string, Vec2][] = LoudJump.checkDegrees.map(deg => [`${deg}`, Vec2.mulC(Vec2.rotate({ x: 0, y: -1 }, (deg * Math.PI) / 180), 16)])
    return {
        Navigation: {
            wall: {
                range: 5 * 16,
                config: LoudWalls.continiousConfig,
                dirs: LoudWalls.dirs.map(e => [e[0], Vec2.mulC(e[1], 16)]),
            },
            jump: {
                config: {
                    paths: ['soundglossaryJump'],
                    // jump voulme is adjusted globally
                },
            },
            collision: {
                config: {
                    paths: ['soundglossaryWallbump'],
                    getVolume: () => Opts.wallBumpVolume,
                },
            },
            jumphintWater: {
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 0),
                dirs: loudjumpDirs,
            },
            jumphintHole: {
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 1),
                dirs: loudjumpDirs,
            },
            jumphintLower: {
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 2),
                dirs: loudjumpDirs,
            },
            jumphintHigher: {
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 3),
                dirs: loudjumpDirs,
            },
            jumphintPlatform: {
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 4),
                dirs: loudjumpDirs,
            },
        },
        Combat: {
            melee: {
                config: {
                    paths: ['soundglossaryMeele'],
                    getVolume: () => Opts.dashVoulme,
                },
            },
            dash: {
                config: {
                    paths: ['dash'],
                    getVolume: () => Opts.dashVoulme,
                },
            },
            levelup: {
                config: { paths: ['levelup'] },
            },
        },
        Entities: {
            interactableNearby: {
                config: SoundManager.pickContiniousSettingsPath(InteractableHandler.continiousConfig, 0),
                forceOmnidirectional: true,
            },
            interactable: {
                config: SoundManager.pickContiniousSettingsPath(InteractableHandler.continiousConfig, 1),
                forceOmnidirectional: true,
            },
            tpr: {
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Door.classId)!,
                forceOmnidirectional: true,
            },
            enemy: {
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Enemy.classId)!,
            },
            puzzle: {
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Switch.classId)!,
            },
        },
        Hints: {
            hint: {
                config: HintSystem.continiousConfig,
            },
            wallscan: {
                config: { ...LoudWalls.continiousConfig, changePitchWhenBehind: false },
                forceOmnidirectional: true,
            },
        },
    } as const satisfies Record</*category */ string, Record</* id */ string, SoundGlossaryEntry>>
}
