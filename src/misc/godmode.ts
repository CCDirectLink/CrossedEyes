export function godmode() {
    sc.stats.statsEnabled = true
    /* prettier-ignore */
    /* make things not crash */ sc.menu.newUnlocks = { 11: [ 'kill-boss-crab', 'dash-01', 'melee-01', 'jumps-done-01', 'combat-arts-02', 'dash-02', 'quests-total-01', 'guard-01', 'element-heat', 'throw-03', 'heal-02', 'heal-03', 'guard-02', 'crits-01', 'kill-01', 'player-level-01', 'melee-02', 'combat-arts-04', 'dash-03', 'element-cold', 'chests-heat', 'heal-04', 'melee-03', 'kill-02', 'chests-arid', 'crits-02', 'dash-04', 'element-wave', 'element-shock', 'chests-shockwave', 'landmarks-rhombus', 'throw-04', 'kill-special-henry', 'crits-03', 'kill-boss-designer', 'kill-boss-elephant', 'old-drill', 'streak-kills-04', 'one-punch', 'one-hit-kills', 'kill-04', ], 12: [], }

    /* prettier-ignore  */
    /* add all party members */ sc.party.onStoragePreLoad!({ party: { models: { Lea: { level: 1, equipLevel: 0, exp: 0, spLevel: 2, allElements: false, temporary: false, noDie: false }, Shizuka: { level: 75, equipLevel: 74, exp: 0, spLevel: '4', allElements: false, temporary: false, noDie: false }, Shizuka0: { level: 1, equipLevel: 0, exp: 0, spLevel: 2, allElements: false, temporary: false, noDie: false }, Emilie: { level: 76, equipLevel: 74, exp: 856, spLevel: '4', allElements: false, temporary: false, noDie: false }, Sergey: { level: 1, equipLevel: 0, exp: 0, spLevel: 2, allElements: false, temporary: false, noDie: false }, Schneider: { level: 74, equipLevel: 74, exp: 412, spLevel: '4', allElements: false, temporary: false, noDie: false }, Schneider2: { level: 60, equipLevel: 59, exp: 795, spLevel: '3', allElements: true, temporary: false, noDie: false }, Hlin: { level: 75, equipLevel: 0, exp: 123, spLevel: 2, allElements: false, temporary: false, noDie: false }, Grumpy: { level: 76, equipLevel: 0, exp: 745, spLevel: 2, allElements: false, temporary: false, noDie: false }, Buggy: { level: 75, equipLevel: 28, exp: 951, spLevel: 2, allElements: false, temporary: false, noDie: false }, Glasses: { level: 76, equipLevel: 74, exp: 284, spLevel: '4', allElements: false, temporary: false, noDie: false }, Apollo: { level: 75, equipLevel: 74, exp: 512, spLevel: '4', allElements: false, temporary: false, noDie: false }, Joern: { level: 74, equipLevel: 74, exp: 123, spLevel: '4', allElements: false, temporary: false, noDie: false }, Triblader1: { level: 41, equipLevel: 30, exp: 118, spLevel: 2, allElements: false, temporary: false, noDie: false }, Luke: { level: 73, equipLevel: 69, exp: 951, spLevel: '4', allElements: false, temporary: false, noDie: false }, triblader2: { level: 1, equipLevel: 0, exp: 0, spLevel: 4, allElements: false, temporary: false, noDie: false }, triblader3: { level: 1, equipLevel: 0, exp: 0, spLevel: 1, allElements: false, temporary: false, noDie: false }, triblader4: { level: 1, equipLevel: 0, exp: 0, spLevel: 1, allElements: false, temporary: false, noDie: false }, triblader5: { level: 1, equipLevel: 0, exp: 0, spLevel: 1, allElements: false, temporary: false, noDie: false }, }, currentParty: [], contacts: { Lea: { status: 0, online: true, locked: false }, Shizuka: { status: 2, online: true, locked: false }, Shizuka0: { status: 0, online: true, locked: false }, Emilie: { status: 2, online: true, locked: false }, Sergey: { status: 1, online: true, locked: false }, Schneider: { status: 2, online: true, locked: false }, Schneider2: { status: 0, online: true, locked: false }, Hlin: { status: 1, online: true, locked: false }, Grumpy: { status: 1, online: true, locked: false }, Buggy: { status: 1, online: true, locked: false }, Glasses: { status: 2, online: true, locked: false }, Apollo: { status: 2, online: true, locked: false }, Joern: { status: 2, online: true, locked: false }, Triblader1: { status: 0, online: true, locked: false }, Luke: { status: 2, online: true, locked: false }, triblader2: { status: 0, online: true, locked: false }, triblader3: { status: 0, online: true, locked: false }, triblader4: { status: 0, online: true, locked: false }, triblader5: { status: 0, online: true, locked: false }, }, strategies: { TARGET: 'WHATEVER', BEHAVIOUR: 'OFFENSIVE', ARTS: 'NORMAL' }, dungeonBlocked: false, lastAreaDungeon: false, }, } as any)

    /* unlock all lore entries */ sc.lore.unlockLoreAll()

    /* prettier-ignore */
    const tradersFound = { rookieHead1: { characterName: 'cross-worlds.pentafist-male-dark', map: { en_US: 'Marketplace', de_DE: 'Marktplatz', fr_FR: 'fr_FR', langUid: 11, zh_CN: '市场', ko_KR: '시장', ja_JP: '市場', zh_TW: '市場' }, area: { en_US: 'Rookie Harbor', de_DE: 'Rookie Harbor', zh_CN: '新手港', zh_TW: '新手港', ja_JP: 'ルーキーハーバー', ko_KR: '초보자 항구', langUid: 246 }, time: 1664953031946, }, rookieTorso2: { characterName: 'rookie-harbor.man-big-black', map: { en_US: 'Marketplace', de_DE: 'Marktplatz', fr_FR: 'fr_FR', langUid: 11, zh_CN: '市场', ko_KR: '시장', ja_JP: '市場', zh_TW: '市場' }, area: { en_US: 'Rookie Harbor', de_DE: 'Rookie Harbor', zh_CN: '新手港', zh_TW: '新手港', ja_JP: 'ルーキーハーバー', ko_KR: '초보자 항구', langUid: 246 }, time: 1664953681310, }, autumnLoot: { characterName: 'cross-worlds.triblader-male-blue', map: { en_US: 'Obelisk Lake', de_DE: 'Obeliskensee', fr_FR: 'fr_FR', langUid: 19, zh_CN: '方尖湖', ko_KR: '방첨탑 호수', ja_JP: 'オベリスク池', zh_TW: '方尖湖', }, area: { en_US: "Autumn's Rise", de_DE: "Autumn's Rise", zh_CN: '秋色山野', zh_TW: '秋色山野', ja_JP: 'オータムライズ', ko_KR: '가을의 부상', langUid: 240 }, time: 1664982122199, }, autumnSets: { characterName: 'cross-worlds.pentafist-male-dark', map: { en_US: 'Obelisk Lake', de_DE: 'Obeliskensee', fr_FR: 'fr_FR', langUid: 19, zh_CN: '方尖湖', ko_KR: '방첨탑 호수', ja_JP: 'オベリスク池', zh_TW: '方尖湖', }, area: { en_US: "Autumn's Rise", de_DE: "Autumn's Rise", zh_CN: '秋色山野', zh_TW: '秋色山野', ja_JP: 'オータムライズ', ko_KR: '가을의 부상', langUid: 240 }, time: 1664982139481, }, bergenMetal: { characterName: 'bergen.male-hoodie-simple', map: { en_US: "Trader's Den", de_DE: 'Händlerhütte', fr_FR: 'fr_FR', langUid: 31, zh_CN: '商贩居所', ko_KR: '상인의 소굴', ja_JP: 'トレーダーの隠れ家', zh_TW: '商販居所', }, area: { en_US: 'Bergen Village', de_DE: 'Bergen', zh_CN: '俾尔根村', zh_TW: '俾爾根村', ja_JP: 'ベルゲン村', ko_KR: '베르겐 마을', langUid: 281 }, time: 1665083972490, }, heatLoot: { characterName: 'baki.male-yellow-tall', map: { en_US: 'East Entrance', de_DE: 'Osteingang', fr_FR: 'fr_FR', langUid: 4, zh_CN: '东入口', ko_KR: '동쪽 입구', ja_JP: '東側入口', zh_TW: '東入口' }, area: { en_US: 'Maroon Valley', de_DE: 'Maronental', zh_CN: '褐红峡谷', zh_TW: '褐紅峽谷', ja_JP: 'マルーン谷', ko_KR: '마룬 밸리', langUid: 3271 }, time: 1665245999160, }, rookieSetsFall: { characterName: 'rookie-harbor.man-big-black', map: { en_US: 'Alley Quarters', de_DE: 'Alleenviertel', fr_FR: 'fr_FR', langUid: 13, zh_CN: '小巷住所', ko_KR: '골목 지역', ja_JP: '本部への通路', zh_TW: '小巷住所', }, area: { en_US: 'Rookie Harbor', de_DE: 'Rookie Harbor', zh_CN: '新手港', zh_TW: '新手港', ja_JP: 'ルーキーハーバー', ko_KR: '초보자 항구', langUid: 246 }, time: 1665498465439, }, rookieKontorFruitA1: { characterName: 'baki.female-pink', map: { en_US: 'Traders Kontor', langUid: 152, zh_CN: '商人办公室<<A<<[CHANGED 2017/12/12]', ko_KR: '교역소<<A<<[CHANGED 2017/12/13]', de_DE: 'Handelskontor', ja_JP: 'トレーダーの商館<<A<<[CHANGED 2017/12/14]', zh_TW: '商人辦公室<<A<<[CHANGED 2017/12/12]', }, area: { en_US: 'Rookie Harbor', de_DE: 'Rookie Harbor', zh_CN: '新手港', zh_TW: '新手港', ja_JP: 'ルーキーハーバー', ko_KR: '초보자 항구', langUid: 246 }, time: 1665498562541, }, rookieRiseMetal3: { characterName: 'rookie-harbor.female-small-red', map: { en_US: 'Alley Quarters', de_DE: 'Alleenviertel', fr_FR: 'fr_FR', langUid: 13, zh_CN: '小巷住所', ko_KR: '골목 지역', ja_JP: '本部への通路', zh_TW: '小巷住所', }, area: { en_US: 'Rookie Harbor', de_DE: 'Rookie Harbor', zh_CN: '新手港', zh_TW: '新手港', ja_JP: 'ルーキーハーバー', ko_KR: '초보자 항구', langUid: 246 }, time: 1666097663500, }, basinEastDrill: { characterName: 'misc.oldman', map: { en_US: 'Pond Slums', de_DE: 'Elendsviertel', fr_FR: 'fr_FR', langUid: 26, zh_CN: '池塘贫民窟', ko_KR: '연못 빈민가', ja_JP: 'ポンド・スラム', zh_TW: '池塘貧民窟', }, area: { en_US: 'Basin Keep', de_DE: 'Burg Bassin', zh_CN: '巴辛堡', zh_TW: '巴辛堡', ja_JP: 'ベイスンキープ', ko_KR: '유역의 아성', langUid: 6713 }, time: 1667603559903, }, } as any
    /* load some traders */ sc.trade.onStoragePreLoad({ tradersFound, vars: { storage: {} } } as any)

    sc.stats.values.tradersFound = Object.keys(tradersFound).reduce((acc, k) => {
        acc[k] = 1
        return acc
    }, {} as any)
    /* load only some enemies */ Object.entries(ig.database.get('enemies'))
        .filter(e => e[1].track && e[0].toLowerCase().startsWith('a'))
        .forEach(e => sc.stats.addMap('combat', 'kill' + e[0], 1))
    /* load all maps */

    for (const k of Object.keysT(sc.model.player.core)) {
        sc.model.player.core[k] = true
    }

    sc.model.player.setSpLevel(4)
    sc.newgame.setActive(true)
    sc.newgame.toggle('infinite-sp')
    sc.model.player.setLevel(99)
    sc.model.player.equip = { head: 657, leftArm: 577, rightArm: 607, torso: 583, feet: 596 }

    sc.model.player.skillPoints.fill(200)
    for (let i = 0; i < 400; i++) sc.model.player.learnSkill(i)
    sc.model.player.skillPoints.fill(0)

    /* filter out circuit override givers */
    const skipItems = new Set([150, 225, 230, 231, 286, 410, 428])
    for (let i = 0; i < sc.inventory.items.length; i++) {
        if (skipItems.has(i)) continue
        sc.model.player.items[i] = 99
        sc.model.player._addNewItem(i)
    }
    sc.model.player.updateStats()

    /* unlock all areas */
    for (const area in sc.map.areas) sc.map.updateVisitedArea(area)

    /* unlock all maps */
    for (const areaName in sc.map.areas) {
        const area = new sc.AreaLoadable(areaName)
        area.load(() => {
            for (const floor of area.data.floors) {
                for (const map of floor.maps) {
                    ig.vars.set(`maps.${map.path.toCamel().toPath('', '')}`, {})
                }
            }
        })
    }
}
