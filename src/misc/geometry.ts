export interface Rect extends Vec2 {
    width: number
    height: number
}

export namespace Rect {
    export function isVecIn(rect: Rect, vec: Vec2): boolean {
        return vec.x >= rect.x && vec.x <= rect.x + rect.width && vec.y >= rect.y && vec.y <= rect.y + rect.height
    }
    export function isVecInArr(rects: Rect[], vec: Vec2): boolean {
        for (const rect of rects) {
            if (Rect.isVecIn(rect, vec)) return true
        }
        return false
    }
}
