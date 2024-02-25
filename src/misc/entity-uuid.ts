export {}

/* in prestart */
const crypto: typeof import('crypto') = (0, eval)('require("crypto")')

ig.Entity.inject({
    init(x, y, z, settings) {
        this.parent(x, y, z, settings)
        this.uuid = crypto.createHash('sha256').update(`${settings.name}-${x},${y}`).digest('hex')
    },
})
