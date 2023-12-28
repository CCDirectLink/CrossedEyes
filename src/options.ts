import { Options } from './optionsManager'
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
                puzzle: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Puzzle assist',
                    description: 'Solve puzzles blindfolded!',
                },
                textBeeping: {
                    type: 'CHECKBOX',
                    init: true,
                    name: 'Text beeping',
                    description: 'Enable text beeping when characters talk',
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
                    description: "TTS Volume (doesn't work)",
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
        },
    } as const satisfies Options
}
