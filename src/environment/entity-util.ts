export class EntityUtil {
    static isOneTimeSwitch(e?: ig.Entity, id?: number): e is ig.ENTITY.OneTimeSwitch {
        return id ? ig.ENTITY.OneTimeSwitch.classId == id : e instanceof ig.ENTITY.OneTimeSwitch
    }
    static isMultiHitSwitch(e?: ig.Entity, id?: number): e is ig.ENTITY.MultiHitSwitch {
        return id ? ig.ENTITY.MultiHitSwitch.classId == id : e instanceof ig.ENTITY.MultiHitSwitch
    }
    static isSwitch(e?: ig.Entity, id?: number): e is ig.ENTITY.Switch {
        return id ? ig.ENTITY.Switch.classId == id : e instanceof ig.ENTITY.Switch
    }
    static isDestructible(e?: ig.Entity, id?: number): e is ig.ENTITY.Destructible {
        return id ? ig.ENTITY.Destructible.classId == id : e instanceof ig.ENTITY.Destructible
    }
    static isEnemy(e?: ig.Entity, id?: number): e is ig.ENTITY.Enemy {
        return id ? ig.ENTITY.Enemy.classId == id : e instanceof ig.ENTITY.Enemy
    }
    static isTeleportGround(e?: ig.Entity, id?: number): e is ig.ENTITY.TeleportGround {
        return id ? ig.ENTITY.TeleportGround.classId == id : e instanceof ig.ENTITY.TeleportGround
    }
    static isTeleportField(e?: ig.Entity, id?: number): e is ig.ENTITY.TeleportField {
        return id ? ig.ENTITY.TeleportField.classId == id : e instanceof ig.ENTITY.TeleportField
    }
    static isDoor(e?: ig.Entity, id?: number): e is ig.ENTITY.Door {
        return id ? ig.ENTITY.Door.classId == id : e instanceof ig.ENTITY.Door
    }
}
