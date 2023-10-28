import { TTSTypes } from "./tts/tts"

const header: string = 'crossedeyes'
const spacialAudioToggleId: string = `${header}-spacialaudio`
const loudWallsToggleId: string = `${header}-loudwalls`
const puzzleToggleId: string = `${header}-puzzle`

const ttsHeader = 'crossedeyes-tts'
const ttsToogleId: string = `${ttsHeader}`
const ttsTypeId: string = `${ttsHeader}-type`
const ttsSpeedId: string = `${ttsHeader}-speed`
const ttsVoulmeId: string = `${ttsHeader}-volume`
const ttsPitchId: string = `${ttsHeader}-pitch`

export class MenuOptions {
    static get spacialAudioEnabled(): boolean { return sc.options?.get(spacialAudioToggleId) as boolean }
    static get loudWallsEnabled(): boolean { return sc.options?.get(loudWallsToggleId) as boolean && MenuOptions.spacialAudioEnabled }
    static get puzzleEnabled(): boolean { return sc.options?.get(puzzleToggleId) as boolean && MenuOptions.spacialAudioEnabled }

    static get ttsEnabled(): boolean { return sc.options?.get(ttsToogleId) as boolean }
    static get ttsType(): TTSTypes { return sc.options?.get(ttsTypeId) as TTSTypes }
    static get ttsSpeed(): number { return sc.options?.get(ttsSpeedId) as number }
    static get ttsVolume(): number{ return sc.options?.get(ttsVoulmeId) as number }
    static get ttsPitch(): number{ return sc.options?.get(ttsPitchId) as number }

    static initPrestart() {
        sc.OPTIONS_DEFINITION[spacialAudioToggleId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header,
            hasDivider: true
        }
        sc.OPTIONS_DEFINITION[loudWallsToggleId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header,
        }
        sc.OPTIONS_DEFINITION[puzzleToggleId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header,
        }

        sc.OPTIONS_DEFINITION[ttsToogleId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header: ttsHeader,
            hasDivider: true,
        }

        sc.OPTIONS_DEFINITION[ttsTypeId] = {
            type: 'BUTTON_GROUP',
            init: TTSTypes['Built-in'],
            data: Object.entries(TTSTypes).splice(Object.keys(TTSTypes).length/2).reduce((acc, [k, _], i) => {
                if (typeof k === 'string') { acc[k] = i }
                return acc
            }, {} as { [key: string]: number }),
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header: ttsHeader,
        }

        {
            const min = 0.8, max = 5, step = 0.1
            const data: Record<number, number> = {}
            for (let i = min, h = 0; i.round(2) <= max; i += step, h++) { data[h] = i.round(2) }
            sc.OPTIONS_DEFINITION[ttsSpeedId] = {
                type: 'OBJECT_SLIDER',
                cat: sc.OPTION_CATEGORY.ASSISTS,
                header: ttsHeader,
                data,
                init: 1,
                fill: true,
                showPercentage: true,
            }
        }
        {
            const min = 0, max = 1, step = 0.1
            const data: Record<number, number> = {}
            for (let i = min, h = 0; i.round(2) <= max; i += step, h++) { data[h] = i.round(2) }
            sc.OPTIONS_DEFINITION[ttsVoulmeId] = {
                type: 'OBJECT_SLIDER',
                cat: sc.OPTION_CATEGORY.ASSISTS,
                header: ttsHeader,
                data,
                init: 1,
                fill: true,
                showPercentage: true,
            }
        }
        {
            const min = 0.5, max = 2, step = 0.1
            const data: Record<number, number> = {}
            for (let i = min, h = 0; i.round(2) <= max; i += step, h++) { data[h] = i.round(2) }
            sc.OPTIONS_DEFINITION[ttsPitchId] = {
                type: 'OBJECT_SLIDER',
                cat: sc.OPTION_CATEGORY.ASSISTS,
                header: ttsHeader,
                data,
                init: 1,
                fill: true,
                showPercentage: true,
            }
        }
    }

    static initPoststart() {
		ig.lang.labels.sc.gui.options.headers[header] = 'CrossedEyes'
        ig.lang.labels.sc.gui.options[spacialAudioToggleId] = {
            name: 'Enable spacial audio',
            description: 'Makes it so you can clearly tell from where the sound is coming from'
        }
        ig.lang.labels.sc.gui.options[loudWallsToggleId] = {
            name: 'Loud walls',
            description: 'Make the walls directonaly beep when you approach them'
        }
        ig.lang.labels.sc.gui.options[puzzleToggleId] = {
            name: 'Puzzle beeps',
            description: 'Solve puzzles blindfolded'
        }
		ig.lang.labels.sc.gui.options.headers[ttsHeader] = 'TTS'
        ig.lang.labels.sc.gui.options[ttsToogleId] = {
            name: 'Enable',
            description: 'Read gui text out loud'
        }
        ig.lang.labels.sc.gui.options[ttsTypeId] = {
            name: 'Type',
            description: 'Reader type',
            group: Object.keys(sc.OPTIONS_DEFINITION[ttsTypeId].data as Record<string, number>),
        }
        ig.lang.labels.sc.gui.options[ttsVoulmeId] = {
            name: 'Volume',
            description: ''
        }
        ig.lang.labels.sc.gui.options[ttsSpeedId] = {
            name: 'Speed',
            description: ''
        }
        ig.lang.labels.sc.gui.options[ttsPitchId] = {
            name: 'Pitch',
            description: ''
        }
    }
}
