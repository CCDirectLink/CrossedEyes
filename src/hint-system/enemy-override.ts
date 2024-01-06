import { MenuOptions } from '../optionsManager'
import { HintSystem } from './hint-system'
import { HEnemy } from './hints/enemy'

export class EnemyHintMenu {
    constructor() {
        /* in prestart */
        ig.ENTITY.Enemy.inject({
            getQuickMenuSettings() {
                if (!MenuOptions.hints) {
                    return this.parent!()
                }
                const isProperEnemy: boolean = this.params && this.visibility.analyzable && sc.combat.isEnemyAnalyzable(this.enemyName)
                return isProperEnemy ? { type: 'Enemy', disabled: false } : { type: 'Hints', hintName: 'Enemy', hintType: 'Puzzle', disabled: !HEnemy.check(this) }
            },
            isBallDestroyer(_collPos, _collRes) {
                return this.enemyName == 'target-bot'
            },
        })

        let enemyInfoBoxIns!: sc.QUICK_INFO_BOXES.Enemy
        sc.QUICK_INFO_BOXES.Enemy.inject({
            init() {
                this.parent()
                enemyInfoBoxIns = this
            },
        })
        sc.EnemyHintMenu = sc.BasicHintMenu.extend({
            init(enemy: ig.ENTITY.Enemy) {
                enemyInfoBoxIns.setData(enemy.enemyName, enemy)
                const name = enemyInfoBoxIns.title.text!.toString()
                const text = `${name}`

                const resArr = enemyInfoBoxIns.resistance.res.map(pn => pn.number.targetNumber) as [number, number, number, number]
                let resStr: string = ''
                for (let i = sc.ELEMENT.HEAT; i <= sc.ELEMENT.WAVE; i++) {
                    const res: number = resArr[i - 1]
                    if (res != 0) {
                        resStr += `${Object.entries(sc.ELEMENT)
                            .find(e => e[1] == i)![0]
                            .toLowerCase()} resistance: ${res}, `
                    }
                }
                const desc1 = `${resStr.length == 0 ? 'no elemental resistances' : resStr}`

                const hp = enemyInfoBoxIns.baseHp.number.targetNumber
                const def = enemyInfoBoxIns.baseDefense.number.targetNumber
                const foc = enemyInfoBoxIns.baseFocus.number.targetNumber
                const atk = enemyInfoBoxIns.baseAttack.number.targetNumber
                const desc2 = `${
                    enemyInfoBoxIns.baseHp.number.scramble ? 'unknown stats' : `level ${enemy.getLevel()}, max hp: ${hp}, defense: ${def}, attack: ${atk}, focus: ${foc}`
                }`
                this.parent(() => {
                    return [text, desc1, desc2]
                })
            },
        })
        sc.QUICK_MENU_TYPES.Enemy.inject({
            init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
                this.parent(type, settings, screen)
                this.nameGui = new sc.EnemyHintMenu(this.entity)
            },
            focusGained() {
                HintSystem.g.activateHint(0, this)
            },
            focusLost() {
                HintSystem.g.deactivateHint(0)
            },
        })
    }
}
