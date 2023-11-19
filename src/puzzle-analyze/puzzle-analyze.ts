import { MenuOptions } from '../options'
import { SoundManager } from '../sound-manager'
import { PuzzleExtensionBounceBlock } from './bounce-block'
import { PuzzleExtensionBounceSwitch } from './bounce-switch'
import { PuzzleExtensionDoor } from './door'
import { PuzzleExtensionEnemy } from './enemy'
import { PuzzleExtensionSwitch } from './switch'
import { PuzzleExtensionTeleportField } from './teleport-field'
import { PuzzleExtensionTeleportGround } from './teleport-ground'

export interface PuzzleExtensionData {
    name: string
    description: string
}
export interface PuzzleExtension {
    entryName: string

    getDataFromEntity<T extends ig.Entity>(entity: T): PuzzleExtensionData
}

export class PuzzleElementsAnalysis {
    registeredTypes: Record<string, PuzzleExtension>
    puzzleTypes = [PuzzleExtensionBounceBlock, PuzzleExtensionBounceSwitch, PuzzleExtensionSwitch,
        PuzzleExtensionDoor, PuzzleExtensionTeleportField, PuzzleExtensionTeleportGround, PuzzleExtensionEnemy]

    quickMenuAnalysisInstance!: sc.QuickMenuAnalysis

    setupGui() {
        const self = this
        let soundHandle: ig.SoundHandleWebAudio | undefined

        sc.QUICK_MENU_TYPES.PuzzleElements = sc.QuickMenuTypesBase.extend({
            init(type: string, settings: sc.QuickMenuTypesBaseSettings, screen: sc.QuickFocusScreen) {
                this.parent(type, settings, screen)
                this.setIconColor(sc.ANALYSIS_COLORS.ORANGE)
                this.showType = sc.SHOW_TYPE.INSTANT

                const data: PuzzleExtensionData = self.registeredTypes[settings.puzzleType!].getDataFromEntity(settings.entity)

                this.nameGui = new sc.PuzzleElementsMenu(data)
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
                this.nameGui.doStateTransition('DEFAULT')
                if (!soundHandle) {
                    soundHandle = ig.SoundHelper.playAtEntity(new ig.Sound(SoundManager.sounds.wall), this.entity, true, {
                        speed: 1
                    }, 10000)
                }
            },
            focusLost() {
                this.nameGui.doStateTransition('HIDDEN')
                if (soundHandle) {
                    soundHandle.stop()
                    soundHandle = undefined
                }
            },
            alignGuiPosition() {
                this.parent()
                this.nameGui.setPosition(this.hook, this.entity)
            },
        })

        sc.PuzzleElementsMenu = ig.BoxGui.extend({
            ninepatch: new ig.NinePatch("media/gui/menu.png", { width: 8, height: 8, left: 8, top: 8, right: 8, bottom: 8, offsets: { default: { x: 432, y: 304 }, flipped: { x: 456, y: 304 } } }),
            transitions: { HIDDEN: { state: { alpha: 0 }, time: 0.2, timeFunction: KEY_SPLINES.LINEAR }, DEFAULT: { state: {}, time: 0.2, timeFunction: KEY_SPLINES.EASE } },
            init(data: PuzzleExtensionData) {
                this.title = new sc.TextGui(data.name, { font: sc.fontsystem.smallFont })
                this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP)
                this.title.setPos(0, 2)
                this.description = new sc.TextGui(data.description, { font: sc.fontsystem.tinyFont, maxWidth: 120 })
                this.parent(127, 17 + this.description.textBlock.size.y)
                this.description.setPos(5, 15)

                this.addChildGui(this.title)
                this.addChildGui(this.description)
                this.doStateTransition('HIDDEN', true)
            },
            setPosition(hook: ig.GuiHook, e: ig.Entity) {
                if (hook.screenCoords) {
                    const pos: Vec2 = Vec2.createC(0, 0)
                    pos.x = hook.screenCoords.x + hook.size.x / 2 - this.hook.size.x / 2
                    pos.y = hook.screenCoords.y - (e.coll.size.y + 14)
                    if (pos.x < 0) {
                        pos.x = pos.x * -1
                        pos.x = pos.x + 1
                    } else if (pos.x + this.hook.size.x > ig.system.width) {
                        pos.x = ig.system.width - (pos.x + this.hook.size.x + 1)
                    } else {
                        pos.x = 0
                    }
                    if (pos.y < 0) {
                        pos.y = e.coll.size.y + 6
                    } else {
                        pos.y = -(e.coll.size.y + 14)
                    }
                    pos.y += 55
                    this.setPos(this.getCenter(hook) + pos.x, hook.pos.y + pos.y)
                }
            },
            getCenter(a: ig.GuiHook) {
                return a.pos.x + a.size.x / 2 - this.hook!.size.x / 2
            },
        })
    }

    constructor() { /* runs in prestart */
        this.registeredTypes = {}
        for (const type of this.puzzleTypes) {
            const inst: PuzzleExtension = new type()
            this.registeredTypes[inst.entryName] = inst
        }

        this.setupGui()

        const self = this
        sc.QuickMenuAnalysis.inject({
            init() {
                this.parent()
                self.quickMenuAnalysisInstance = this
            }
        })

        let currentSelectIndex: number = -1
        let prevEntry: sc.QuickMenuTypesBase
        sc.QuickMenuAnalysis.inject({
            update(...args) {
                if (sc.quickmodel.currentState == sc.QUICK_MENU_STATE.CHECK && MenuOptions.puzzleEnabled) {
                    let add = ig.gamepad.isButtonPressed(ig.BUTTONS.LEFT_SHOULDER) ? -1 :
                        ig.gamepad.isButtonPressed(ig.BUTTONS.RIGHT_SHOULDER) ? 1 : 0
                    if (add != 0) {
                        const pPos: Vec3 = Vec3.create(ig.game.playerEntity.coll.pos)
                        const sorted: sc.QuickMenuTypesBase[] =
                            self.quickMenuAnalysisInstance.entities.filter(e => e)
                                .sort((a, b) => Vec3.distance(a.entity.coll.pos, pPos) - Vec3.distance(b.entity.coll.pos, pPos))
                        if (currentSelectIndex == -1) {
                            currentSelectIndex = 0
                        } else {
                            currentSelectIndex += add
                            if (currentSelectIndex == sorted.length) { currentSelectIndex = 0 }
                            else if (currentSelectIndex == -1) { currentSelectIndex = 0 }
                        }
                        const entry: sc.QuickMenuTypesBase = sorted[currentSelectIndex]

                        if (entry) {
                            sc.quickmodel.cursorMoved = true
                            sc.quickmodel.cursor = Vec2.createC(
                                entry.hook.pos.x + entry.hook.size.x / 2,
                                entry.hook.pos.y + entry.hook.size.y / 2,
                            )
                            this.cursor.moveTo(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, true)

                            prevEntry && prevEntry.focusLost()
                            prevEntry = entry
                        }
                    }
                }
                return this.parent(...args)
            },
            show() {
                this.parent()
                currentSelectIndex = -1
            },
        })

        ig.EVENT_STEP.SET_PLAYER_CORE.inject({
            start() {
                /* enable the quick menu at the start of the game */
                if (MenuOptions.puzzleEnabled && this.core == sc.PLAYER_CORE.QUICK_MENU && this.value == false) {
                    return
                }
                this.parent()
            }
        })
    }
}
