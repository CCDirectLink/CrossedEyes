import { TTS, TTS_TYPES } from './tts/tts'
import { updateQuickRingMenuLayoutLock } from './misc/quick-menu-layout-enforce'
import { updateIdlePose } from './misc/idle-pose-disable'

import type { Options, Option } from 'ccmodmanager/types/mod-options'
import { Lang } from './lang-manager'

export let Opts: ReturnType<typeof modmanager.registerAndGetModOptions<ReturnType<typeof registerOpts>>>

export function registerOpts() {
    const opts = {
        volumes: {
            settings: {
                title: Lang.optsCategories.volumes,
                tabIcon: 'general',
            },
            headers: {
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
                    cliffSafeguardVolume: {
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
            },
        },
        general: {
            settings: {
                title: 'General',
                tabIcon: 'video',
            },
            headers: {
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
            },
        },
        tts: {
            settings: {
                title: Lang.optsCategories.tts,
                tabIcon: 'interface',
            },
            headers: {
                tts: {
                    tts: {
                        type: 'CHECKBOX',
                        init: true,
                        changeEvent: () => TTS.g.optionChangeEvent(),
                        updateMenuOnChange: true,
                    },
                    ttsType: {
                        type: 'BUTTON_GROUP',
                        init: TTS_TYPES.WebSpeech,
                        enum: TTS_TYPES,
                        changeEvent: () => TTS.g.setup(),
                        hidden: () => !modmanager.options['crossedeyes'].tts,
                        updateMenuOnChange: true,
                    },
                    ttsChar: {
                        type: 'CHECKBOX',
                        init: true,
                        hidden: () => !modmanager.options['crossedeyes'].tts,
                    },
                    ttsSpeed: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 0.8,
                        max: 5,
                        step: 0.1,
                        fill: true,
                        showPercentage: true,
                        hidden: () => !modmanager.options['crossedeyes'].tts || modmanager.options['crossedeyes'].ttsType != TTS_TYPES.WebSpeech,
                    },
                    ttsVolume: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        fill: true,
                        showPercentage: true,
                        hidden: () => !modmanager.options['crossedeyes'].tts || modmanager.options['crossedeyes'].ttsType != TTS_TYPES.WebSpeech,
                    },
                    ttsPitch: {
                        type: 'OBJECT_SLIDER',
                        init: 1,
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                        fill: true,
                        showPercentage: true,
                        hidden: () => !modmanager.options['crossedeyes'].tts || modmanager.options['crossedeyes'].ttsType != TTS_TYPES.WebSpeech,
                    },
                },
            },
        },
        funcionality: {
            settings: {
                title: Lang.optsCategories.functionality,
                tabIcon: 'gamepad',
            },
            headers: {
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
                    },
                    lockDiorbitalMenu: {
                        type: 'CHECKBOX',
                        init: true,
                        changeEvent: () => updateQuickRingMenuLayoutLock(),
                    },
                },
            },
        },
    } as const satisfies Options
    Opts = modmanager.registerAndGetModOptions(
        {
            modId: 'crossedeyes',
            title: Lang.crossedeyes,
            languageGetter: (_category: string, _header: string, optionId: string, _option: Option) => {
                return Lang.opts[optionId as keyof typeof Lang.opts]
            },
            // helpMenu: Lang.help.options,
        },
        opts
    )
    return opts
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
