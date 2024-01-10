import { MenuOptions } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HDestructible implements Hint {
    entryName = 'Destructible'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Destructible.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.desType = settings.desType
            },
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !MenuOptions.hints }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Destructible)) {
            throw new Error()
        }

        let name: string = 'Destructible'
        let description: string = ''
        if (e.desType == 'boxLarge') {
            name = 'Destructible, Large box'
            description = 'Destroy with a few hits!'
        } else if (e.desType == 'boxMedium') {
            name = 'Destructible, Medium box'
            description = 'Destroy with a hit!'
        } else if (e.desType == 'boxMedNorth') {
            name = 'Destructible, Medium box, Armored except north'
            description = 'This box has armor! You can only hit it from the north.'
        } else if (e.desType == 'boxMedSouth') {
            name = 'Destructible, Medium box, Armored except south'
            description = 'This box has armor! You can only hit it from the south.'
        } else if (e.desType == 'boxMedEast') {
            name = 'Destructible, Medium box, Armored except east'
            description = 'This box has armor! You can only hit it from the east.'
        } else if (e.desType == 'boxMedWest') {
            name = 'Destructible, Medium box, Armored except west'
            description = 'This box has armor! You can only hit it from the west.'
        }
        return { name, description }
    }
}
