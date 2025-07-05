/**
 * 基地节点角色模块（能量链尾节点）
 * 负责从倒数第二个节点接收能量并转移到基地存储结构
 * @param {Creep} creep - 执行角色逻辑的creep
 */
module.exports = function(creep) {
    const chain = Memory.energyChains[creep.memory.chainId];
    if (!chain) {
        console.log(`链ID ${creep.memory.chainId} 不存在，${creep.name} 无法执行任务`);
        return;
    }

    const nodeIndex = creep.memory.nodeIndex;
    // 验证节点索引是否为链尾
    if (nodeIndex !== chain.nodePositions.length - 1) {
        console.log(`${creep.name} 不是链尾节点，索引: ${nodeIndex}`);
        return;
    }

    // 移动到链尾节点固定位置
    const nodePos = new RoomPosition(
        chain.nodePositions[nodeIndex].x,
        chain.nodePositions[nodeIndex].y,
        creep.room.name
    );

    if (!creep.pos.isEqualTo(nodePos)) {
        creep.moveTo(nodePos, { visualizePathStyle: { stroke: '#00ffff' }, reusePath: 50 });
        return;
    }

    // 寻找基地存储目标（优先Spawn和Extension）
    const storageTargets = creep.room.find(FIND_MY_STRUCTURES, {
        filter: s => (
            s.structureType === STRUCTURE_SPAWN ||
            s.structureType === STRUCTURE_EXTENSION ||
            s.structureType === STRUCTURE_TOWER
        ) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    // 如果有存储目标且creep有能量，优先存入基地
    if (storageTargets.length > 0 && creep.store[RESOURCE_ENERGY] > 0) {
        const target = storageTargets[0];
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
        }
    }
    // 否则接收上一节点能量
    else if (creep.store.getFreeCapacity() > 0) {
        const prevCreepName = chain.creepNames[nodeIndex - 1];
        const prevCreep = prevCreepName ? Game.creeps[prevCreepName] : null;

        if (prevCreep && prevCreep.store[RESOURCE_ENERGY] > 0) {
            if (prevCreep.transfer(creep, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                prevCreep.moveTo(creep, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
            }
        }
    }
    // 当没有存储目标且能量已满时，存入Storage
    else if (creep.store[RESOURCE_ENERGY] === creep.store.getCapacity()) {
        const storage = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })[0];

        if (storage) {
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50 });
            }
        }
    }
};