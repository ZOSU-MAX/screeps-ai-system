/**
 * 采集者角色模块
 * 负责从资源点采集能量并转移到存储结构
 * @param {Creep} creep - 执行角色逻辑的creep
 */
module.exports = function(creep) {
    // 状态切换：如果能量为空则切换到采集状态
    if (creep.store.getFreeCapacity() > 0 && creep.memory.working) {
        creep.memory.working = false;
        creep.say('🔄 采集');
    }
    // 状态切换：如果能量满了则切换到工作状态
    else if (creep.store.getFreeCapacity() === 0 && !creep.memory.working) {
        creep.memory.working = true;
        creep.say('🚚 运输');
    }

    // 工作状态：转移能量
    if (creep.memory.working) {
        // 优先填充Spawn和Extension
        const targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: structure => (
                (structure.structureType === STRUCTURE_SPAWN ||
                 structure.structureType === STRUCTURE_EXTENSION ||
                 structure.structureType === STRUCTURE_TOWER)
                && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            )
        });

        // 如果有紧急填充目标
        if (targets.length > 0) {
            if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            // 否则存入Storage
            const storage = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE &&
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (storage.length > 0) {
                if (creep.transfer(storage[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                // 没有存储目标时升级控制器作为备选
                if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    } else {
        // 采集状态：从资源点采集能量
        const sources = creep.room.find(FIND_SOURCES);
        // 优先选择有容器的资源点
        const sourceWithContainer = sources.find(source => {
            const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            })[0];
            return container && container.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        });

        let targetSource = sourceWithContainer || sources[0];

        // 如果有记忆中的资源点ID，优先使用
        if (creep.memory.sourceId) {
            const memorySource = Game.getObjectById(creep.memory.sourceId);
            if (memorySource) {
                targetSource = memorySource;
            } else {
                // 记忆的资源点不存在，清除记忆
                delete creep.memory.sourceId;
                // 回退到默认资源点
                targetSource = sourceWithContainer || sources[0];
                creep.memory.sourceId = targetSource.id;
            }
        } else {
            // 分配资源点并记忆
            creep.memory.sourceId = targetSource.id;
        }

        if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
};