import type * as _ from 'nax-ccuilib/src/headers/nax/quick-menu-public-api.d.ts'
import type * as __ from 'nax-ccuilib/src/headers/nax/quick-menu.d.ts'
import { Lang } from './lang-manager'
import { Options } from './options-manager'
import { Opts } from './plugin'
import { TTS, TTS_TYPES } from './tts/tts'
import { updateQuickRingMenuLayoutLock } from './misc/quick-menu-layout-enforce'
import { updateIdlePose } from './misc/idle-pose-disable'

export function getOptions() {
    return {
        [sc.OPTION_CATEGORY.ASSISTS]: {
            battle: {
                enemyVulnerableMulti: {
                    type: 'OBJECT_SLIDER',
                    init: 2,
                    min: 1,
                    max: 5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
            },
            tts: {
                tts: {
                    type: 'CHECKBOX',
                    init: true,
                    changeEvent: () => TTS.g.optionChangeEvent(),
                    saveToLocalStorage: true,
                },
                ttsType: {
                    type: 'BUTTON_GROUP',
                    init: TTS_TYPES['Web Speech'],
                    enum: TTS_TYPES,
                    changeEvent: () => TTS.g.setup(),
                    saveToLocalStorage: true,
                },
                ttsChar: {
                    type: 'CHECKBOX',
                    init: true,
                },
                ttsSpeed: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.8,
                    max: 5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    saveToLocalStorage: true,
                },
                ttsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    saveToLocalStorage: true,
                },
                ttsPitch: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    saveToLocalStorage: true,
                },
            },
            volumes: {
                footstepVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1.5,
                    min: 1,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                jumpVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1.5,
                    min: 1,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                dashVoulme: {
                    type: 'OBJECT_SLIDER',
                    init: 1.5,
                    min: 1,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                wallVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                wallBumpVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                jumpHintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                wallScanVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                hintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                interactableVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
                entityHintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                },
            },
            functionality: {
                textBeeping: {
                    type: 'CHECKBOX',
                    init: true,
                },
                spacialAudio: {
                    type: 'CHECKBOX',
                    init: true,
                },
                disableIdlePose: {
                    type: 'CHECKBOX',
                    init: true,
                    changeEvent: () => updateIdlePose(),
                },
                loudWalls: {
                    type: 'CHECKBOX',
                    init: true,
                },
                loudEntities: {
                    type: 'CHECKBOX',
                    init: true,
                },
                hints: {
                    type: 'CHECKBOX',
                    init: true,
                },
                hudVisible: {
                    type: 'CHECKBOX',
                    init: true,
                    saveToLocalStorage: true,
                },
                lockDiorbitalMenu: {
                    type: 'CHECKBOX',
                    init: true,
                    changeEvent: () => updateQuickRingMenuLayoutLock(),
                    saveToLocalStorage: true,
                },
            },
        },
    } as const satisfies Options
}

{
    /* check if options.ts and the language .json file contain the same entries */
    // prettier-ignore
    type IfEquals<T, U, Y=unknown, N=never> =
        (<G>() => G extends T ? 1 : 2) extends
        (<G>() => G extends U ? 1 : 2) ? Y : N;
    type Diff<T, U> = T extends U ? never : T

    type OptLangEntryMissing = Diff<keyof typeof Opts.flatOpts, keyof (typeof Lang)['opts']>
    const optLangEntryMissingError = `ERROR: Option language entry missing: -->`
    const _optLangEntryMissingCheck: IfEquals<OptLangEntryMissing, never, typeof optLangEntryMissingError, ` ${OptLangEntryMissing}`> = optLangEntryMissingError
    typeof _optLangEntryMissingCheck /* supress unused info */

    type OptConfigEntryMissing = Diff<keyof (typeof Lang)['opts'], keyof typeof Opts.flatOpts>
    const optConfigEntryMissingError = `ERROR: Option config entry missing: -->`
    const _optConfigEntryMissing: IfEquals<OptConfigEntryMissing, never, typeof optConfigEntryMissingError, ` ${OptConfigEntryMissing}`> = optConfigEntryMissingError
    typeof _optConfigEntryMissing /* supress unused info */
}
