import { MenuOptions } from '../options-manager'
import { HintSystem } from './hint-system'
import { ClimbableMenuSettings } from '../types'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

export class ClimbableTerrainHints {
    private createFakeEntity(pos: Vec3, size: Vec3) {
        return {
            coll: { pos, size },
            uuid: crypto.createHash('sha256'),
            getCenter: function () {
                return Vec2.createC(this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y + this.coll.size.y / 2)
            },
            getAlignedPos: ig.Entity.prototype.getAlignedPos,
        }
    }

    private getLevelFromZ(z: number): number {
        for (const i in ig.game.levels) {
            if (ig.game.levels[i].height! + 5 >= z && ig.game.levels[i].height! - 5 <= z) {
                return parseInt(i)
            }
        }
        return -1
    }
    private getSurroundingTiles(e: ig.Entity): Vec3[] {
        const p: Vec3 = e.coll.pos
        const s: Vec3 = e.coll.size

        const x1 = (p.x / 16 - 1).floor()
        const x2 = ((p.x + s.x) / 16 + 1).ceil()
        const y1 = ((p.y - p.z) / 16 - 1).floor()
        const y2 = ((p.y + s.y - p.z) / 16 + 1).ceil()

        const lvl = this.getLevelFromZ(p.z)
        if (lvl == -1) {
            return []
        }

        const tiles: Vec3[] = []
        for (let x = x1 + 1; x < x2; x++) {
            tiles.push(Vec3.createC(x, y1, lvl))
            tiles.push(Vec3.createC(x, y2, lvl))
        }
        for (let y = y1 + 1; y < y2; y++) {
            tiles.push(Vec3.createC(x1, y, lvl))
            tiles.push(Vec3.createC(x2, y, lvl))
        }
        return tiles
    }

    private isTileBlocking(tile: number | undefined): boolean {
        if (tile === undefined) return false
        return tile == 2 || (tile >= 8 && tile <= 11) || (tile >= 19 && tile <= 23)
    }

    private isTileJumpable(tilePos: Vec3): boolean {
        const levels = Object.values(ig.game.levels).filter(l => l.collision && l.height !== undefined)
        const origLvl = levels[tilePos.z]
        const nextLvlI = levels.findIndex(o => o.height == origLvl.height! + 32)
        let nextLvl = levels[nextLvlI]
        if (!nextLvl) {
            return false
        }
        let t1
        if (origLvl.collision?.data) {
            t1 = origLvl.collision.data[tilePos.y][tilePos.x]
        }
        let t2, t4
        if (nextLvl.collision?.data) {
            t2 = nextLvl.collision.data[tilePos.y][tilePos.x]
            t4 = (nextLvl.collision.data[tilePos.y - 2] ?? [])[tilePos.x]
        }
        let nextnextLvl = levels[nextLvlI + 1]
        let t3
        if (nextnextLvl?.collision?.data) {
            t3 = nextnextLvl.collision.data[tilePos.y][tilePos.x]
        }
        return t1 == 2 && (t2 == 1 || t2 == 3) && (t3 == undefined || t3 == 1) && (t4 == undefined || !this.isTileBlocking(t4))
    }

    private checkIsJumpable(e: ig.Entity): boolean {
        const sur = this.getSurroundingTiles(e)
        for (const tile of sur) {
            if (this.isTileJumpable(tile)) {
                return true
            }
        }
        return false
    }

    constructor() {
        /* in prestart */
        const self = this

        sc.ClimbableMenu = sc.BasicHintMenu.extend({
            init(settings: ClimbableMenuSettings) {
                const prop: ig.ENTITY.Prop = settings.entity as ig.ENTITY.Prop
                const pt = prop.propName
                let name = ''
                let description = ''
                if (pt.startsWith('cargo-box')) {
                    name = 'Cargo box, jumpable'
                    description = 'You can jump on me to get to higher places!'
                }
                this.parent(() => {
                    return [name, description, null]
                })
            },
        })
        sc.QUICK_MENU_TYPES.Climbable = sc.QuickMenuTypesBase.extend({
            init(type: string, settings: ClimbableMenuSettings, screen: sc.QuickFocusScreen) {
                const entity: ig.Entity = settings.entity ?? self.createFakeEntity(settings.pos!, settings.size ?? Vec3.createC(16, 16, 0))
                settings.entity = entity
                this.parent(type, settings as any, screen)
                this.setIconColor(sc.ANALYSIS_COLORS.GREY)
                this.showType = sc.SHOW_TYPE.INSTANT

                this.nameGui = new sc.ClimbableMenu(settings)
                this.nameGui.setPivot(this.nameGui.hook.size.x / 2, 0)
                this.nameGui.hook.transitions = {
                    DEFAULT: { state: {}, time: 0.1, timeFunction: KEY_SPLINES.EASE },
                    HIDDEN: { state: { alpha: 0, scaleX: 0.3, offsetY: 8 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
                }
                this.nameGui.doStateTransition('HIDDEN', true)
                this.screen.addSubGui(this.nameGui)
            },
            onAnalysisEnter() {
                this.nameGui.setPosition(this.hook, this.entity)
                this.parent()
            },
            onAnalysisExit() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
            },
            focusGained() {
                this.parent()
                this.nameGui.doStateTransition('DEFAULT')
                HintSystem.g.activateHint(this.entity)
            },
            focusLost() {
                this.parent()
                this.nameGui.doStateTransition('HIDDEN')
                HintSystem.g.deactivateHint(HintSystem.g.focusedHE)
            },
            alignGuiPosition() {
                this.parent()
                this.nameGui.setPosition(this.hook, this.entity)
            },
        })

        ig.ENTITY.Prop.inject({
            getQuickMenuSettings(): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> {
                return {
                    type: 'Climbable',
                    hintName: 'ClimbableProp',
                    disabled: !(MenuOptions.hints && this.coll.type == ig.COLLTYPE.BLOCK && this.propName.startsWith('cargo-box') && self.checkIsJumpable(this)),
                }
            },
        })
        sc.QuickMenuAnalysis.inject({
            populateHintList() {
                this.parent()
            },
        })
    }
}
