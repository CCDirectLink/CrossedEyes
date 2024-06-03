import { Lang } from '../../lang-manager'
import { Opts } from '../../options'
import { HintBase, HintData, HintSystem } from '../hint-system'

const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

export class HClimbableTerrain implements HintBase {
    entryName = 'Climbable' as const

    private static wProps: Record<string, HintData>
    private static sProps: Record<string, HintData>
    private static checkIsClimbable = new Set<string>(['cargo-box1', 'cargo-box2'])

    constructor() {
        /* in prestart */
        HintSystem.customColors['Climbable'] = sc.ANALYSIS_COLORS.GREY
        /* ig.ENTITY.Prop injection in prop.ts */

        HClimbableTerrain.wProps = Lang.hints.climbableProps.wholeMatch
        HClimbableTerrain.sProps = Lang.hints.climbableProps.startsWith
        // sc.QuickMenuAnalysis.inject({
        //     populateHintList() {
        //         this.parent()
        //     },
        // })
    }

    getDataFromEntity(e: ig.Entity) {
        if (!(e instanceof ig.ENTITY.Prop)) throw new Error()
        return HClimbableTerrain.getPropLang(e)!
    }

    private static getPropLang(e: ig.ENTITY.Prop) {
        const pt = e.propName
        if (this.wProps[pt]) return this.wProps[pt]
        for (const startsWith in this.sProps) {
            if (pt.startsWith(startsWith)) return this.sProps[startsWith]
        }
    }
    private static checkProp(e: ig.ENTITY.Prop): boolean {
        if (!Opts.hints) return false
        const lang = this.getPropLang(e)
        if (!lang) return false
        if (this.checkIsClimbable.has(e.propName)) return this.checkIsJumpable(e)
        return true
    }

    private static getLevelFromZ(z: number): number {
        for (const i in ig.game.levels) {
            if (ig.game.levels[i].height! + 5 >= z && ig.game.levels[i].height! - 5 <= z) {
                return parseInt(i)
            }
        }
        return -1
    }
    private static getSurroundingTiles(e: ig.Entity): Vec3[] {
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

    private static isTileBlocking(tile: number | undefined): boolean {
        if (tile === undefined) return false
        return tile == 2 || (tile >= 8 && tile <= 11) || (tile >= 19 && tile <= 23)
    }

    private static isTileJumpable(tilePos: Vec3): boolean {
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

    private static checkIsJumpable(e: ig.Entity): boolean {
        const sur = this.getSurroundingTiles(e)
        for (const tile of sur) {
            if (this.isTileJumpable(tile)) {
                return true
            }
        }
        return false
    }

    static getPropConfig(e: ig.ENTITY.Prop): Omit<sc.QuickMenuTypesBaseSettings, 'entity'> | undefined {
        if (this.checkProp(e)) return { type: 'Hints', hintType: 'Climbable', hintName: 'Climbable' }
    }

    /* unused (at least for now) */
    createFakeEntity(pos: Vec3, size: Vec3) {
        return {
            coll: { pos, size },
            uuid: crypto.createHash('sha256'),
            getCenter: function () {
                return Vec2.createC(this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y + this.coll.size.y / 2)
            },
            getAlignedPos: ig.Entity.prototype.getAlignedPos,
        }
    }
}
