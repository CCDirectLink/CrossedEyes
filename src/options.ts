const header: string = 'crossedeyes'
const spacialAudioToggleId: string = `${header}-spacialaudio`
const loudWallsToggleId: string = `${header}-loudwalls`
const puzzleToggleId: string = `${header}-puzzle`
const ttsToogleId: string = `${header}-tts`

export class MenuOptions {
    static get spacialAudioEnabled(): boolean { return sc.options?.get(spacialAudioToggleId) as boolean }
    static set spacialAudioEnabled(value: boolean) { sc.options?.set(spacialAudioToggleId, value) }

    static get loudWallsEnabled(): boolean { return sc.options?.get(loudWallsToggleId) as boolean && MenuOptions.spacialAudioEnabled }
    static set loudWallsEnabled(value: boolean) { sc.options?.set(loudWallsToggleId, value) }

    static get puzzleEnabled(): boolean { return sc.options?.get(puzzleToggleId) as boolean && MenuOptions.spacialAudioEnabled }
    static set puzzleEnabled(value: boolean) { sc.options?.set(puzzleToggleId, value) }

    static get ttsEnabled(): boolean { return sc.options?.get(ttsToogleId) as boolean }
    static set ttsEnabled(value: boolean) { sc.options?.set(ttsToogleId, value) }

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
            header,
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
        ig.lang.labels.sc.gui.options[ttsToogleId] = {
            name: 'Gui TTS',
            description: 'Read gui text out loud'
        }

    }
}
