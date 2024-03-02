import { Lang } from '../lang-manager'

export class FontToImgMap {
    private static map: Record<string, string>

    public static convert(name: string): string {
        if (sc.fontsystem.gamepadIconStyle == sc.GAMEPAD_ICON_STYLE.PS3) {
            if (name == 'gamepad-x') return Lang.menu.fontImgToTextMap['gamepad-dualshock-x']
            if (name == 'gamepad-y') return Lang.menu.fontImgToTextMap['gamepad-dualshock-y']
            if (name == 'gamepad-b') return Lang.menu.fontImgToTextMap['gamepad-dualshock-b']
            if (name == 'gamepad-a') return Lang.menu.fontImgToTextMap['gamepad-dualshock-a']
        }
        let rep = FontToImgMap.map[name]
        if (rep?.startsWith('!')) rep = this.convert(rep.substring(1))
        return rep
    }

    constructor() {
        /* in prestart */
        FontToImgMap.map = {
            ...(() => {
                const obj: Record<string, string> = {}
                for (let i = 0; i < 256; i++) {
                    obj[`keyCode-${i}`] = `Key ${String.fromCharCode(i)}`
                }
                return obj
            })(),
            ...Lang.menu.fontImgToTextMap,
            help: '!gamepad-pause',
            help2: '!gamepad-x',
            help3: '!gamepad-y',
            help4: '!right-stick-press',
            'circle-left': '!gamepad-l1',
            dash: '!gamepad-l1',
            'circle-right': 'gamepad-r1',
            throw: 'gamepad-r1',
            quick: 'gamepad-l2',
            special: '!gamepad-r2',
            menu: '!gamepad-select',
            guard: '!gamepad-a',
            back: '!gamepad-b',
            'skip-cutscene': '!gamepad-y',
            'item-helm-scale': '!item-helm',
            'item-sword-scale': '!item-sword',
            'item-sword-rare': '!item-sword',
            'item-belt-scale': '!item-belt',
            'item-shoe-scale': '!item-shoe',
            'language-0': '',
            'language-1': '',
            'language-2': '',
            'language-3': '',
            'language-4': '',
            'language-5': '',
            'diff-2': '',
            '<': '',
            '>': '',
            tech: '',
            'item-items': '',
            'item-key': '',
            'item-news': '',
            quest: '' /* todo? */,
            'lore-others': '',
            'stats-general': '',
            ascended: '',
        }
    }
}
