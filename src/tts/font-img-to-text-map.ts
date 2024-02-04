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
        const rep = FontToImgMap.map[name]
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
            menu: '',
            help2: '',
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
            help: '',
            back: '',
            help3: '',
        }
    }
}
