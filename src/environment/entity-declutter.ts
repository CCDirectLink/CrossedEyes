import { Opts } from '../options-manager'

/* quick way to calculate hash for adding stuff
const crypto = require('crypto')
function calc(name, x, y) {
    return crypto.createHash('sha256').update(`${name}-${x},${y}`).digest('hex')
}
*/
type DeclutterEntry = /* first letter is the selector type:
    U: uuid
    P: all props that type starts with
    */ string | { new (x: number, y: number, z: number, settings: any): any }

type DeclutterData = Record</*map*/ string, DeclutterEntry[]>

export class EntityDecluterrer {
    constructor() {
        const declutterData: DeclutterData = {
            'cargo-ship.teleporter': ['Pcargo-box'],
            'cargo-ship.room1': [
                'U900262fe020818b02f60692f3b5b5062bdea6362ca4ca8fc82c059745535feaf' /* bottom left stack */,
                'U18505bebb27d1ed6562600be405e6a2a6be0b94c69c05684ab64e87160da3100' /* bottom left stack */,
                'Uf6550d35c0668d9cd3a7ac03564c438878c708818ccb4fdf1259ea192da30cdc' /* bottom left stack */,
                'U4917bdfdf8b8c1f950f42804a90c2b092371f2b65f63d8d291621328abb56fc5' /* bottom left stack */,
                'U0bdce635bd72fce7b4bb62c40a5a839be5482a2ff6fd69ab17dbaa1f83d20245' /* bottom left stack */,
                'U14cbb3503c85dbdfd4bd092ebc7dbfcd20e93e70414151622a166873bd0f1066' /* middle vertical */,
                'Ufb559c649555a9051afe53ab12458bccbb4b614268b34d151c18ee88ccf926ca' /* middle between desctuctibles */,
                'Ud224ad7dcd4721c693bc16c2f906a4542011a8377705a94301b932ccfc84866f' /* middle between desctuctibles */,
                'U6653448fbdb76b03e3a819161bb92181adaee13e4ab31bd5e06c5f190097f002' /* middle between desctuctibles */,
                'Ucb3704bfbafb95d9684c4b198e61783550e8dab57b3e593b210f6c67dedc77be' /* middle right */,
            ],
            'cargo-ship.room1-5': [
                'U158c20b546f31318a3976327089ef5215d5a91b727388883471d42368d3fdae8' /* bottom left */,
                'U28ffd2d0c9043e5a1bdf3e0e1ee23428b4c3b2a15afae35edba4aaa75af11483' /* bottom left */,
                'Ua84815d7ba37effbfb7d3546672a23acf9a021156231ec3055a43eca6fb66941' /* upper left */,
                'U7c82adfac9e1e14efdae3aee187dd5d06c66c875ee142d18d9a5a7ceda1bbdb7' /* upper right */,
                'U9396887353ee7a5ccfa0e688eeda93c2c9cde36aa6937cac1f2922d5ca7b2a7a' /* upper right */,
                'U10d8c46f37a5c25128fc99e79b8a92827a6bd566c477be830794e467056fdd17' /* middle right */,
                'U4ffdf31bb2604d2cf3084e0699432fb8d292b83d1088bf0c1001a3fdc3a192f2' /* middle */,
                'U653aeb54c501f9a882edf22b794e99f0f26337f57a3b5f348fefe88edb06c611' /* middle */,
                'U17f2ae303ab57d492b81d039b078631d92f771154eaf1017db91a0ca3d0ecc01' /* bottom middle */,
                'U351c912ab65a62d33fbbb81ef2e351ff8c117c97da20f6f9a76f0bd0efaeea92' /* bottom middle */,
                'U94cb0c6691f562af0771e0188ae100dab0ced7aa65fac8576ccdb1caa40f24c0' /* bottom right */,
            ],
            'cargo-ship.room2': [
                'U8efa01441bdb1668f87eb388e7cb96d4ad6374cc01dd1f062f32b5926f1757e0' /* middle left */,
                'U4988c9fffe5747313e42d3a2b9fbf7c090119bf9af2563ccfd3b31e0882cde04' /* middle left */,
                'Ufc5495c90cd6d1d1aaf6dad77ecd5a2274d05458b2c924393529b8bcff25f4e9' /* middle left */,
                'Uabb32e086a5b973ee5565b356384a86c939c1b58d1f8f703bb809256afce7e64' /* middle left */,
                'Ua61b494e3205016560d3db18c3951fecc5f1ec5510ff7c8d697378a8c53719d0' /* middle left */,
                'U2440c6b50d8444377f4108d7ebe90a0be9a9d19f6ac97fc1ca704e9957fef612' /* middle left */,
                'U1e2de376fe201e387ed11b0abdfb8f00b4942ecd73d3c9673dc941c43cc43483' /* middle */,
                'Ud09dc7c1a6dcde542ec1dfa8f0cb3650694c7d3fea71d085ec907ffafe171c71' /* middle */,
                'U417629378f17b252a0f3be8f42d801f3a34e09ef5f66c2a5ed24205f0f56dc03' /* middle */,
                'U351a4bff0b30b1c4fdcc635d85d3c53b68ceae54d4a1763955c17127fed46697' /* bottom middle*/,
                'U77bb760fdaefc989a23d4cf7e34fb5491c32db272c2155a15abcd6591025a723' /* bottom middle*/,
            ],
            'cargo-ship.room4': ['Pcargo-box'],
            'cargo-ship.room-end': ['Pcargo-box'],
            'cargo-ship.ground': [
                'Ub95375eef963e1c55dd1173459ea63be41cb552e1337c6932ea792870d9f9f24' /* bottom left */,
                'Ua79a6f6b20352e9af870ffeffdf224acf2b8b317271ca9d72cbf0265f7fede6b' /* bottom left */,
                'U919cd31560a23b62876779b81264c313379bdd1d36361fd7c54571ce495b8f68' /* bottom left */,
                'U7cbdc7b9f9b8b47626f53b6da9d16ff48d00b96f101e39c5fb3233394577d052' /* step up replaced by prop */,
            ],
            'rhombus-dng.room-1-6': [ig.ENTITY.Analyzable],
        }
        /* in prestart */
        function executeAction(entry: DeclutterEntry) {
            const entities = ig.game.entities.filter(Boolean)
            if (typeof entry === 'string') {
                const rest = entry.substring(1)
                if (entry.startsWith('U')) {
                    entities.find(e => e.uuid == rest)?.kill()
                } else if (entry.startsWith('P')) {
                    entities.forEach(e => e instanceof ig.ENTITY.Prop && e.propName.startsWith(rest) && e.kill())
                } else throw new Error('invalid action')
            } else {
                const toKill = entities.filter(e => e instanceof entry)
                toKill.forEach(e => {
                    e.kill()
                })
                ig.game.conditionalEntities = ig.game.conditionalEntities.filter(o => !toKill.includes(o.entity))
            }
        }

        ig.Game.inject({
            loadingComplete() {
                this.parent()
                if (!Opts.hints) return
                declutterData[ig.game.mapName]?.forEach(executeAction)
            },
        })
    }
}
