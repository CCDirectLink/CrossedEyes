import { EntityBeeper } from '../environment/entity-beeper'
import { InteractableHandler as InteractableHandler } from '../environment/interactables'
import { LoudJump } from '../environment/loudjump'
import { LoudWalls } from '../environment/loudwalls'
import { HintSystem } from '../hint-system/hint-system'
import { Opts } from '../options-manager'
import { SoundManager } from '../sound-manager'
import { SoundGlossary } from './sound-glossary'

export function getSoundGlossaryEntries() {
    const loudjumpDirs: [string, Vec2][] = LoudJump.checkDegrees.map(deg => [`${deg}`, Vec2.mulC(Vec2.rotate({ x: 0, y: -1 }, (deg * Math.PI) / 180), 16)])
    return {
        Navigation: [
            {
                name: 'Wall',
                description: `Plays at the wall if it there is one.
                    It checks four directions: north, east, south and east.
                    The directions aren't related to which way the player is facing.
                    The closer you are, the louder the sound gets.
                    When the player is facing away from the wall, a lower pitch version plays.`,
                range: 5 * 16,
                config: LoudWalls.continiousConfig,
                dirs: LoudWalls.dirs.map(e => [e[0], Vec2.mulC(e[1], 16)]),
            },
            {
                name: 'Jump',
                description: `The player jumps automaticly right before the edge.
                    Can vary depending on the terrain you are jumping from.`,
                config: {
                    paths: ['soundglossaryJump'],
                    // jump voulme is adjusted globally
                },
            },
            {
                name: 'Collision',
                description: `Plays when you run into an obstacle that stops your movement.
                    The more your movement is blocked by the obstacle, the louder the sound.`,
                config: {
                    paths: ['soundglossaryWallbump'],
                    getVolume: () => Opts.wallBumpVolume,
                },
            },
            {
                name: 'Jump hint: water',
                description: `For 8 directions around the player, this sound will play at each location where the player would fall into water.
                    The directions are rotated with the player facing.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 0),
                dirs: loudjumpDirs,
            },
            {
                name: 'Jump hint: hole',
                description: `For 8 directions around the player, this sound will play at each location where the player would fall into a hole.
                    The directions are rotated with the player facing.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 1),
                dirs: loudjumpDirs,
            },
            {
                name: 'Jump hint: lower',
                description: `For 8 directions around the player, this sound will play at each location where the player would descend into a lower Y level.
                    This can mean downwards stairs or that you can jump down onto a lower platfrom.
                    The directions are rotated with the player facing.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 2),
                dirs: loudjumpDirs,
            },
            {
                name: 'Jump hint: higer',
                description: `For 8 directions around the player, this sound will play at each location where the player would ascend into a higer Y level.
                    This can mean upwards stairs or that you can jump up onto a higer platfrom.
                    The directions are rotated with the player facing.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 3),
                dirs: loudjumpDirs,
            },
            {
                name: 'Jump hint: platform',
                description: `For 8 directions around the player, this sound will play at each location where the player would jump across a hole and land onto a platform.
                    The directions are rotated with the player facing.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: SoundManager.pickContiniousSettingsPath(LoudJump.continiousConfig, 4),
                dirs: loudjumpDirs,
            },
        ],
        Combat: [
            {
                name: 'Melle attack',
                description: `You attack using \\i[gamepad-x] or \\i[gamepad-r1].
                    After attacking 3 times in quick succesion, the forth attack will be a multi-directional spin that does more damage, but will leave you vulnerable for half a second.`,
                config: {
                    paths: ['soundglossaryMeele'],
                    getVolume: () => Opts.dashVoulme,
                },
            },
            {
                name: 'Dash',
                description: `You dash using \\i[gamepad-l1].
                    You can dash up to three times in a row, after that you have to wait a little bit, otherwise you will start spinning while covering very little distance.`,
                config: {
                    paths: ['dash'],
                    getVolume: () => Opts.dashVoulme,
                },
            },
            {
                name: 'Level up',
                description: `You level up after gathering more than 1000 expiernce points since last level up.
                    An animation plays, annoucing how much stats you've gained.`,
                config: { paths: ['levelup'] },
            },
        ],
        Entities: [
            {
                name: 'Interactable nearby',
                description: `Plays when something you can interact with is nearby.`,
                config: SoundManager.pickContiniousSettingsPath(InteractableHandler.continiousConfig, 0),
                forceOmnidirectional: true,
            },
            {
                name: 'Can interact',
                description: `Plays when you can interact with something.
                    Use \\i[gamepad-a] to interact.`,
                config: SoundManager.pickContiniousSettingsPath(InteractableHandler.continiousConfig, 1),
                forceOmnidirectional: true,
            },
            {
                name: `Door or path to a different map`,
                description: 'Plays at doors or paths.',
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Door.classId)!,
                forceOmnidirectional: true,
            },
            {
                name: 'Enemy',
                description: `Plays at enemies.
                    When the player is facing away from the entity, a lower pitch version plays.`,
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Enemy.classId)!,
            },
            {
                name: 'Various hit-able puzzle elements',
                description: `Plays at various hit-able puzzle elements.
                    You can hit them either with a ball or a meele attack.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: EntityBeeper.getSoundConfig(undefined, ig.ENTITY.Switch.classId)!,
            },
        ],
        Hints: [
            {
                name: 'Hint',
                description: `Plays when a hint is selected.
                    When the player is facing away from the hint, a lower pitch version plays.`,
                config: HintSystem.continiousConfig,
            },
            {
                name: 'Wall scan',
                description: `To turn on wall scanning, to the quick menu with \\i[gamepad-l2] and press \\i[gamepad-y].
                    When wall scanning is on, plays at a wall you're aiming at.`,
                config: { ...LoudWalls.continiousConfig, changePitchWhenBehind: false },
                forceOmnidirectional: true,
            },
        ],
    } as const satisfies Record</*category */ string, SoundGlossary.Entry[]>
}
