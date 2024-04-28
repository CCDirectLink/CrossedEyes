import { Lang } from '../../lang-manager'
import { Opts } from '../../plugin'
import { HintSystem } from '../hint-system'
import { HEnemy } from '../hints/enemy'

declare global {
    namespace sc {
        namespace QUICK_MENU_TYPES {
            interface Enemy {
                entity: ig.ENTITY.Enemy
                nameGui: sc.EnemyHintMenu
            }
        }
        interface EnemyHintMenu extends sc.BasicHintMenu {}
        interface EnemyHintMenuConstructor extends ImpactClass<EnemyHintMenu> {
            new (enemy: ig.ENTITY.Enemy): EnemyHintMenu
        }
        var EnemyHintMenu: EnemyHintMenuConstructor
    }
}

/* in prestart */
ig.ENTITY.Enemy.inject({
    getQuickMenuSettings() {
        if (!Opts.hints) return this.parent!()
        const isProperEnemy: boolean = this.params && this.visibility.analyzable && sc.combat.isEnemyAnalyzable(this.enemyName)
        return isProperEnemy
            ? { type: 'Enemy', disabled: false }
            : {
                  type: 'Hints',
                  hintName: 'Enemy',
                  hintType: 'Puzzle',
                  disabled: !HEnemy.check(this),
                  dontEmitSound: !HEnemy.shouldEmitSound(this),
                  aimBounceWhitelist: HEnemy.isAimBounceWhitelisted(this),
              }
    },
    isBallDestroyer(_collPos, _collRes) {
        if (!Opts.hints) {
            return this.parent ? this.parent(_collPos, _collRes) : false
        }
        return this.enemyName == 'target-bot' || this.enemyName == 'baggy-kun'
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
        // prettier-ignore
        const str = [
                    [resArr[0], Lang.stats.heat],
                    [resArr[1], Lang.stats.cold],
                    [resArr[2], Lang.stats.shock],
                    [resArr[3], Lang.stats.wave],
                ].filter(e => e[0] != 0).map(e => Lang.stats.resistanceTemplate.supplant({
                    percentage: e[0],
                    element: e[1]
                })).join(', ')

        const desc1 = `${str ? str : Lang.stats.noElementalResistances}`

        const hp = enemyInfoBoxIns.baseHp.number.targetNumber
        const defense = enemyInfoBoxIns.baseDefense.number.targetNumber
        const focus = enemyInfoBoxIns.baseFocus.number.targetNumber
        const attack = enemyInfoBoxIns.baseAttack.number.targetNumber
        const desc2 = `${
            enemyInfoBoxIns.baseHp.number.scramble
                ? Lang.stats.unknownStats
                : Lang.stats.statTemplate.supplant({
                      level: enemy.getLevel(),
                      hp,
                      defense,
                      focus,
                      attack,
                  })
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
        this.parent()
        HintSystem.g.activateHint(this.entity)
    },
    focusLost() {
        this.parent()
        HintSystem.g.deactivateHint(HintSystem.g.focusedHE)
    },
})
