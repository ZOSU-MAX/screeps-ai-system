/**
 * 资源点节点角色模块（能量链头节点）
 * 负责从资源点采集能量并传递给下一个节点
 * @param {Creep} creep - 执行角色逻辑的creep
 */
module.exports = function(creep) {
    const chain = Memory.energyChains[creep.memory.chainId];
    if (!chain) {
        console.log(`链ID ${creep.memory.chainId} 不存在，${creep.name} 无法执行任务`);
        return;
    }

    const source = Game.getObjectById(creep.memory.chainId);
    if (!source) {
        console.log(`资源点 ${creep.memory.chainId} 不存在，${creep.name} 无法执行任务`);
        return;
    }

    // 移动到资源点固定位置
    const nodePos = new RoomPosition(
        chain.nodePositions[0].x,
        chain.nodePositions[0].y,
        creep.room.name
    );

    if (!creep.pos.isEqualTo(nodePos)) {
        creep.moveTo(nodePos, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 50 });
        return;
    }

    // 采集能量
    if (creep.store.getFreeCapacity() > 0) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }, reusePath: 50 });
        }
    }
    // 传递给下一节点
    else if (creep.store[RESOURCE_ENERGY] > 0) {
        const nextCreepName = chain.creepNames[1];
        const nextCreep = nextCreepName ? Game.creeps[nextCreepName] : null;

        if (nextCreep && nextCreep.store.getFreeCapacity() > 0) {
            if (creep.transfer(nextCreep, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(nextCreep, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
            }
        }
    }
};