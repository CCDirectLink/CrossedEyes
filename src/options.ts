import { Options } from './options-manager'
import { TTSTypes } from './tts/tts'

export function getOptions() {
    return {
        [sc.OPTION_CATEGORY.ASSISTS]: {
            crossedeyes: {
                spacialAudio: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Enable spacial audio',
                    description: 'Makes it so you can clearly tell from where the sound is coming from',
                },
                loudWalls: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Loud walls',
                    description: 'Make the walls directonaly beep when you approach them',
                },
                loudEntities: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Entity noises',
                    description: 'Makes entities emit noise while nearby',
                },
                hints: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Hint system',
                    description: 'The hint sytstem allows you to see what objects are around you',
                },
                textBeeping: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Text beeping',
                    description: 'Enable text beeping when characters talk',
                },
            },
            tts: {
                ttsEnabled: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Enable TTS',
                    description: 'Enable TTS',
                },
                ttsType: {
                    type: 'BUTTON_GROUP',
                    init: TTSTypes['Web Speech'],
                    enum: TTSTypes,
                    name: 'TTS Type',
                    description: 'Reader type, Requires a restart!',
                },
                ttsChar: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'TTS Character text',
                    description: 'Read character text',
                },
                ttsSpeed: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.8,
                    max: 5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'TTS Speed',
                    description: 'TTS voulme',
                },
                ttsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'TTS Volume',
                    description: 'TTS Volume (may not work)',
                },
                ttsPitch: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'TTS Pitch',
                    description: 'TTS pitch',
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
                    name: 'Footstep volume',
                    description: 'Footstep volume multiplier',
                },
                jumpVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1.5,
                    min: 1,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Jump volume',
                    description: 'Jump volume multiplier',
                },
                dashVoulme: {
                    type: 'OBJECT_SLIDER',
                    init: 1.5,
                    min: 1,
                    max: 3,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Dash volume',
                    description: 'Dash volume multiplier',
                },
                wallVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Wall volume',
                    description: 'Wall volume multiplier',
                },
                wallBumpVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Wall bumping volume',
                    description: 'Wall bumping volume multiplier',
                },
                jumpHintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Jump hints volume',
                    description: 'Jump hints volume multiplier',
                },
                wallScanVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Wall scan volume',
                    description: 'Wall scan volume multiplier',
                },
                hintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 1.5,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Hints volume',
                    description: 'Hints volume multiplier',
                },
                interactableVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Interactable volume',
                    description: 'Interactable volume multiplier',
                },
                entityHintsVolume: {
                    type: 'OBJECT_SLIDER',
                    init: 1,
                    min: 0,
                    max: 2,
                    step: 0.1,
                    fill: true,
                    showPercentage: true,
                    name: 'Entity hints volume',
                    description: 'Entity hints volume multiplier',
                },
            },
        },
    } as const satisfies Options
}
