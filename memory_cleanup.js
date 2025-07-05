/**
 * 内存清理模块
 * 移除无效的游戏对象引用，优化内存占用
 */
module.exports = function() {
    // 清理已死亡的creep内存
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log(`Cleaned up memory for dead creep: ${name}`);
        }
    }

    // 清理无效的房间内存数据
    for (const roomName in Memory.rooms) {
        const room = Game.rooms[roomName];
        if (!room) {
            delete Memory.rooms[roomName];
            continue;
        }

        // 验证资源点是否仍然存在
        Memory.rooms[roomName].sources = Memory.rooms[roomName].sources.filter(id => Game.getObjectById(id));
        // 验证控制器是否仍然存在
        if (Memory.rooms[roomName].controllerId && !Game.getObjectById(Memory.rooms[roomName].controllerId)) {
            delete Memory.rooms[roomName].controllerId;
        }
    }

    // 清理能量链中死亡的Creep引用
    for (const chainId in Memory.energyChains) {
        const chain = Memory.energyChains[chainId];
        if (chain.creepNames) {
            chain.creepNames = chain.creepNames.map(creepName => 
                Game.creeps[creepName] ? creepName : ''
            );
        }
    }

    console.log('Memory cleanup completed successfully');
};