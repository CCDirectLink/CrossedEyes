import CrossedEyes, { InitPoststart } from './plugin'
import { TTSTypes } from './tts/tts'

const header: string = 'crossedeyes'
const spacialAudioToggleId: string = `${header}-spacialaudio`
const loudWallsToggleId: string = `${header}-loudwalls`
const loudEntitiesToogleId: string = `${header}-loudentities`
const puzzleToggleId: string = `${header}-puzzle`
const footstepVolumeId: string = `${header}-footstepvol`

const ttsHeader = 'crossedeyes-tts'
const ttsToogleId: string = `${ttsHeader}`
const ttsCharToogleId: string = `${ttsHeader}-chartts`
const ttsMenuToogleId: string = `${ttsHeader}-menutts`
export const ttsTypeId: string = `${ttsHeader}-type`
const ttsSpeedId: string = `${ttsHeader}-speed`
const ttsVoulmeId: string = `${ttsHeader}-volume`
const ttsPitchId: string = `${ttsHeader}-pitch`

function opt(id: string): any {
    return sc.options?.get(id)
}
function sopt(id: string, v: any) {
    sc.options?.set(id, v)
}

export class MenuOptions implements InitPoststart {
    static get spacialAudioEnabled(): boolean { return opt(spacialAudioToggleId) }
    static get loudWallsEnabled(): boolean { return opt(loudWallsToggleId) && MenuOptions.spacialAudioEnabled }
    static get loudEntitiesEnabled(): boolean { return opt(loudEntitiesToogleId) && MenuOptions.spacialAudioEnabled }
    static get puzzleEnabled(): boolean { return opt(puzzleToggleId) && MenuOptions.spacialAudioEnabled }
    static get footstepVolume(): number { return opt(footstepVolumeId) }

    static get ttsEnabled(): boolean { return opt(ttsToogleId) }
    static get ttsCharEnabled(): boolean { return opt(ttsCharToogleId) && MenuOptions.ttsEnabled }
    static get ttsMenuEnabled(): boolean { return opt(ttsMenuToogleId) && MenuOptions.ttsEnabled }
    static get ttsType(): TTSTypes { return opt(ttsTypeId) }
    static set ttsType(v: TTSTypes) { sopt(ttsTypeId, v) }
    static get ttsSpeed(): number { return opt(ttsSpeedId) }
    static get ttsVolume(): number { return opt(ttsVoulmeId) }
    static get ttsPitch(): number { return opt(ttsPitchId) }

    static save() {
        sc.options.persistOptions()
    }

    constructor() { /* in prestart */
        CrossedEyes.initPoststarters.push(this)
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
        sc.OPTIONS_DEFINITION[loudEntitiesToogleId] = {
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
        {
            const min = 1, max = 3, step = 0.1
            const data: Record<number, number> = {}
            for (let i = min, h = 0; i.round(2) <= max; i += step, h++) { data[h] = i.round(2) }
            sc.OPTIONS_DEFINITION[footstepVolumeId] = {
                type: 'OBJECT_SLIDER',
                cat: sc.OPTION_CATEGORY.ASSISTS,
                header: ttsHeader,
                data,
                init: 1,
                fill: true,
                showPercentage: true,
            }
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
            data: Object.entries(TTSTypes).splice(Object.keys(TTSTypes).length / 2).reduce((acc, [k, _], i) => {
                if (typeof k === 'string') { acc[k] = i }
                return acc
            }, {} as { [key: string]: number }),
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header: ttsHeader,
        }
        sc.OPTIONS_DEFINITION[ttsCharToogleId] = {
            type: 'CHECKBOX',
            init: true,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            header: ttsHeader,
        }
        sc.OPTIONS_DEFINITION[ttsMenuToogleId] = {
            type: 'CHECKBOX',
            init: true,
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

    initPoststart() {
        ig.lang.labels.sc.gui.options.headers[header] = 'CrossedEyes'
        ig.lang.labels.sc.gui.options[spacialAudioToggleId] = { name: 'Enable spacial audio', description: 'Makes it so you can clearly tell from where the sound is coming from' }
        ig.lang.labels.sc.gui.options[loudWallsToggleId] = { name: 'Loud walls', description: 'Make the walls directonaly beep when you approach them' }
        ig.lang.labels.sc.gui.options[loudEntitiesToogleId] = { name: 'Entity noises', description: 'Makes entities emit noise while nearby' }
        ig.lang.labels.sc.gui.options[puzzleToggleId] = { name: 'Puzzle assist', description: 'Solve puzzles blindfolded!' }
        ig.lang.labels.sc.gui.options[footstepVolumeId] = { name: 'Footstep volume', description: 'Footstep volume multiplier' }

        ig.lang.labels.sc.gui.options.headers[ttsHeader] = 'TTS'
        ig.lang.labels.sc.gui.options[ttsToogleId] = { name: 'Enable TTS', description: 'Enable TTS' }
        ig.lang.labels.sc.gui.options[ttsTypeId] = {
            name: 'TTS Type', description: 'Reader type, Requires a restart!',
            group: Object.keys(sc.OPTIONS_DEFINITION[ttsTypeId].data as Record<string, number>),
        }
        ig.lang.labels.sc.gui.options[ttsCharToogleId] = { name: 'TTS Character text', description: 'Read character text' }
        ig.lang.labels.sc.gui.options[ttsMenuToogleId] = { name: 'TTS Menu text', description: 'Read menu text' }
        ig.lang.labels.sc.gui.options[ttsVoulmeId] = { name: 'TTS Volume', description: 'TTS voulme (doesn\'t work)' }
        ig.lang.labels.sc.gui.options[ttsSpeedId] = { name: 'TTS Speed', description: 'TTS speed' }
        ig.lang.labels.sc.gui.options[ttsPitchId] = { name: 'TTS Pitch', description: 'TTS pitch' }
    }
}
