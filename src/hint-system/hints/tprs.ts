import { MenuOptions } from '../../options'
import { Hint, HintData } from '../hint-system'

export class HDoor implements Hint {
    entryName = 'Door'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.Door.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled && this.condition.code != 'false') }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Door)) { throw new Error() }

        const name: string = `Door, ${e.active ? 'active' : 'inactive'}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}

export class HTeleportField implements Hint {
    entryName = 'TeleportField'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.TeleportField.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints', hintName: self.entryName, hintType: 'Puzzle',
                    disabled: !(MenuOptions.puzzleEnabled && this.interactEntry)
                }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.TeleportField)) { throw new Error() }

        const text: string | undefined = (((e.interactEntry.gui.subGui as sc.IconHoverTextGui).getChildGuiByIndex(0).gui) as sc.TextGui).text?.toString()
        const name: string = `Teleport Field${text ? ` to ${text}` : ''}`
        const description: string = `Teleports you to ${text ? text : 'a different map'}`
        return { name, description }
    }
}

export class HTeleportGround implements Hint {
    entryName = 'TeleportGround'

    constructor() { /* run in prestart */
        const self = this
        ig.ENTITY.TeleportGround.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled) }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.TeleportGround)) { throw new Error() }

        const name: string = `Teleport Ground`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}

export class HElevator implements Hint {
    entryName = 'Elevator'

    constructor() { /* run in prestart */
        const self = this
        sc.ElevatorSwitchEntity.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.puzzleEnabled && this.groundEntity.condition.code != 'false') }
            },
            isQuickMenuVisible() { return true },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof sc.ElevatorSwitchEntity)) { throw new Error() }

        const name: string = `Elevator${e.groundEntity.condition.evaluate() ? '' : ', inactive'}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}
