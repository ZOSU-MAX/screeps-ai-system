/**
 * 中间传输节点角色模块
 * 负责接收上一节点能量并传递给下一节点，形成能量传输链
 * @param {Creep} creep - 执行角色逻辑的creep
 */
module.exports = function(creep) {
    const chain = Memory.energyChains[creep.memory.chainId];
    if (!chain) {
        console.log(`链ID ${creep.memory.chainId} 不存在，${creep.name} 无法执行任务`);
        return;
    }

    const nodeIndex = creep.memory.nodeIndex;
    // 验证节点索引有效性
    if (nodeIndex <= 0 || nodeIndex >= chain.nodePositions.length - 1) {
        console.log(`${creep.name} 节点索引 ${nodeIndex} 无效`);
        return;
    }

    // 移动到当前节点固定位置
    const nodePos = new RoomPosition(
        chain.nodePositions[nodeIndex].x,
        chain.nodePositions[nodeIndex].y,
        creep.room.name
    );

    if (!creep.pos.isEqualTo(nodePos)) {
        creep.moveTo(nodePos, { visualizePathStyle: { stroke: '#ffff00' }, reusePath: 50 });
        return;
    }

    // 接收上一节点能量
    if (creep.store.getFreeCapacity() > 0) {
        const prevCreepName = chain.creepNames[nodeIndex - 1];
        const prevCreep = prevCreepName ? Game.creeps[prevCreepName] : null;

        if (prevCreep && prevCreep.store[RESOURCE_ENERGY] > 0) {
            if (prevCreep.transfer(creep, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                prevCreep.moveTo(creep, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
            }
        }
    }
    // 传递能量给下一节点
    else if (creep.store[RESOURCE_ENERGY] > 0) {
        const nextCreepName = chain.creepNames[nodeIndex + 1];
        const nextCreep = nextCreepName ? Game.creeps[nextCreepName] : null;

        if (nextCreep && nextCreep.store.getFreeCapacity() > 0) {
            if (creep.transfer(nextCreep, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(nextCreep, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
            }
        }
    }
};