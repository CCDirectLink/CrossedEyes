const fontImgToNameMap: Record<string, string> = {
    ...(() => {
        const obj: Record<string, string> = {}
        for (let i = 0; i < 256; i++) { obj[`keyCode-${i}`] = `Key ${String.fromCharCode(i)}` }
        return obj
    })(),
    'left-stick': 'Gamepad: left stick,',
    'right-stick': 'Gamepad: right stick,',
    'gamepad-left': 'Gamepad: left,',
    'gamepad-down': 'Gamepad: down,',
    'gamepad-right': 'Gamepad: right,',
    'gamepad-up': 'Gamepad: up,',
    'gamepad-l1': 'Gamepad: L1,',
    'gamepad-r1': 'Gamepad: R1,',
    'gamepad-l2': 'Gamepad: L2,',
    'gamepad-r2': 'Gamepad: R2,',
    'gamepad-pause': 'Gamepad: pause,',
    'gamepad-select': 'Gamepad: select,',
    'gamepad-a': 'Gamepad: A,',
    'gamepad-b': 'Gamepad: B,',
    'gamepad-x': 'Gamepad: X,',
    'gamepad-y': 'Gamepad: Y,',
    'left-stick-left': 'Gamepad: left stick: left,',
    'left-stick-right': 'Gamepad: left stick: right,',
    'left-stick-press': 'Gamepad: left stick: press,',
    'right-stick-press': 'Gamepad: right stick: press,',
    'gamepad-l1-off': 'Gamepad: L1 off,',
    'gamepad-r1-off': 'Gamepad: R1 off,',
    
    'dash': 'Gamepad: L1,',
    'guard': 'Gamepad: A,',
    'throw': 'Gamepad: R1,',
    'special': 'Gamepad: R2,',

    'twitter': 'twitter',
    'menu': '',
    'help2': '',
    'language-0': '',
    'language-1': '',
    'language-2': '',
    'language-3': '',
    'language-4': '',
    'language-5': '',
    'diff-2': '',
    '<': '',
    '>': '',
    'tech': '',
    'item-helm-scale': '',
    'item-sword-scale': '',
    'item-belt-scale': '',
    'item-shoe-scale': '',
}


export function fontImgToName(name: string): string {
    if (sc.fontsystem.gamepadIconStyle == sc.GAMEPAD_ICON_STYLE.PS3) {
        if (name == 'gamepad-x') { return 'Gamepad: square' }
        if (name == 'gamepad-y') { return 'Gamepad: triangle' }
        if (name == 'gamepad-b') { return 'Gamepad: circle' }
        if (name == 'gamepad-a') { return 'Gamepad: X' }
    }
    const rep = fontImgToNameMap[name]
    return rep
}
