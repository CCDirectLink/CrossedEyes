import { Opts } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

export class HDestructible implements Hint {
    entryName = 'Destructible'

    private descturcibles: Record</* propName */ string, HintData> = {
        boxLarge: {
            name: 'Destructible, Large box',
            description: 'Destroy with a few hits!',
        },
        boxMedium: {
            name: 'Destructible, Medium box',
            description: 'Destroy with a hit!',
        },
        boxMedNorth: {
            name: 'Destructible, Medium box, Armored except north',
            description: 'This box has armor! You can only hit it from the north.',
        },
        boxMedSouth: {
            name: 'Destructible, Medium box, Armored except south',
            description: 'This box has armor! You can only hit it from the south.',
        },
        boxMedEast: {
            name: 'Destructible, Medium box, Armored except east',
            description: 'This box has armor! You can only hit it from the east.',
        },
        boxMedWest: {
            name: 'Destructible, Medium box, Armored except west',
            description: 'This box has armor! You can only hit it from the west.',
        },
        default: {
            name: 'Destructible, Unmapped',
            description: 'report this to the developer!',
        },
    } as const

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Destructible.inject({
            init(x, y, z, settings) {
                this.parent(x, y, z, settings)
                this.desType = settings.desType
            },
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !Opts.hints }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Destructible)) throw new Error()
        return this.descturcibles[e.desType] ?? this.descturcibles.default
    }
}
