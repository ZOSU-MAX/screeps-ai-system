/**
 * 内存初始化模块
 * 确保系统启动时必要的内存结构已创建并设置默认值
 */
module.exports = function() {
    // 初始化能量链配置
    if (!Memory.energyChains) {
        Memory.energyChains = {};
    }

    // 初始化全局配置
    if (!Memory.config) {
        Memory.config = {
            creepRoles: {
                harvester: { body: [WORK, CARRY, MOVE], minCount: 2, priority: 1 },
                upgrader: { body: [WORK, CARRY, MOVE], minCount: 3, priority: 2 },
                builder: { body: [WORK, CARRY, MOVE], minCount: 2, priority: 3 }
            },
            towerSettings: {
                repairThreshold: 0.7,
                attackPriority: ['invader', 'player', 'npc']
            }
        };
    }

    // 初始化房间内存
    for (const roomName in Game.rooms) {
        if (!Memory.rooms[roomName]) {
            Memory.rooms[roomName] = {
                sources: [],
                controllerId: room.controller ? room.controller.id : null,
                constructionSites: [],
                towers: [],
                spawns: []
            };
            // 扫描并存储房间资源点
            const sources = Game.rooms[roomName].find(FIND_SOURCES);
            Memory.rooms[roomName].sources = sources.map(source => source.id);
        }
    }

    console.log('Memory initialization completed successfully');
};