const header: string = 'crossedeyes'
const spacialAudioToggleId: string = `${header}-spacialaudio`
const loudWallsToggleId: string = `${header}-loudwalls`

export class MenuOptions {
    static get spacialAudioEnabled(): boolean { return sc.options?.get(spacialAudioToggleId) as boolean }
    static set spacialAudioEnabled(value: boolean) { sc.options?.set(spacialAudioToggleId, value) }

    static get loudWallsEnabled(): boolean { return sc.options?.get(loudWallsToggleId) as boolean && MenuOptions.spacialAudioEnabled }
    static set loudWallsEnabled(value: boolean) { sc.options?.set(loudWallsToggleId, value) }

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

    }
}
