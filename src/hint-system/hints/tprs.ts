import { MenuOptions } from '../../options-manager'
import { Hint, HintData } from '../hint-system'

type TprsFlagSupported = ig.ENTITY.Door | ig.ENTITY.TeleportGround | ig.ENTITY.TeleportField
function getVarName(e: TprsFlagSupported): string {
    return genVarName('map', '', e.name!, e.map, e.marker)
}
function genVarName(prefix: string, currMap: string, name: string, map: string, marker: string): string {
    return `${prefix}${currMap.toCamel().replace(/\./, '/')}.crossedeyes-tpr-entered_${name.replace(/\./, '@')}-${map.toCamel().replace(/\./, '/')}-${marker.replace(
        /\./,
        '@'
    )}`
}

let justEnteredTpr: boolean = false

export class HDoor implements Hint {
    entryName = 'Door'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.Door.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !(MenuOptions.hints && this.condition.code != 'false') }
            },
            open(entity, data) {
                if (MenuOptions.hints) {
                    ig.vars.set(getVarName(this), true)
                    justEnteredTpr = true
                }
                this.parent(entity, data)
            },
        })

        function filterTprs(e: ig.Entity[]): TprsFlagSupported[] {
            return e.filter(e => e instanceof ig.ENTITY.Door || e instanceof ig.ENTITY.TeleportGround || e instanceof ig.ENTITY.TeleportField) as any[]
        }
        ig.Game.inject({
            loadLevel(data, clearCache, reloadCache) {
                this.parent(data, clearCache, reloadCache)
                if (justEnteredTpr) {
                    let entities = filterTprs(ig.game.entities.filter(e => e.name == ig.game.marker))
                    if (entities.length != 1) {
                        entities = filterTprs(ig.game.getEntitiesInCircle(ig.game.playerEntity.coll.pos, 4 * 16, 1, 300))
                    }
                    for (const e of entities) {
                        const path = genVarName('maps.', ig.game.mapName, e.name!, e.map, e.marker)
                        MenuOptions.hints && ig.vars.set(path, true)
                    }
                    justEnteredTpr = true
                }
            },
        })
    }

    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.Door)) {
            throw new Error()
        }

        const name: string = `Door, ${e.active ? 'active' : 'inactive'}${ig.vars.get(getVarName(e)) ? ', visited ' : ''}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}

export class HTeleportField implements Hint {
    entryName = 'TeleportField'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.TeleportField.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Puzzle',
                    disabled: !(MenuOptions.hints && this.interactEntry),
                }
            },
            onInteraction() {
                this.parent()
                justEnteredTpr = true
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.TeleportField)) {
            throw new Error()
        }

        const text: string | undefined = ((e.interactEntry.gui.subGui as sc.IconHoverTextGui).getChildGuiByIndex(0).gui as sc.TextGui).text?.toString()
        const name: string = `Teleport Field${text ? ` to ${text}` : ''}${ig.vars.get(getVarName(e)) ? ', visited ' : ''}`
        const description: string = `Teleports you to ${text ? text : 'a different map'}`
        return { name, description }
    }
}

export class HTeleportGround implements Hint {
    entryName = 'TeleportGround'

    constructor() {
        /* run in prestart */
        const self = this
        ig.ENTITY.TeleportGround.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return { type: 'Hints', hintName: self.entryName, hintType: 'Puzzle', disabled: !MenuOptions.hints }
            },
            collideWith(entity, dir) {
                this.parent(entity, dir)
                if (this.coll.ignoreCollision) {
                    /* this means the player just entered the tpr */
                    ig.vars.set(getVarName(this), true)
                    justEnteredTpr = false
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof ig.ENTITY.TeleportGround)) {
            throw new Error()
        }

        const name: string = `Teleport Ground${ig.vars.get(getVarName(e)) ? ', visited ' : ''}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}

export class HElevator implements Hint {
    entryName = 'Elevator'

    constructor() {
        /* run in prestart */
        const self = this
        sc.ElevatorSwitchEntity.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Hints',
                    hintName: self.entryName,
                    hintType: 'Puzzle',
                    disabled: !(MenuOptions.hints && this.groundEntity.condition.code != 'false'),
                }
            },
        })
    }
    getDataFromEntity(e: ig.Entity): HintData {
        if (!(e instanceof sc.ElevatorSwitchEntity)) {
            throw new Error()
        }

        const name: string = `Elevator${e.groundEntity.condition.evaluate() ? '' : ', inactive'}`
        const description: string = `Transports you to a different map`
        return { name, description }
    }
}
