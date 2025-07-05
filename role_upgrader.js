/**
 * 升级者角色模块
 * 负责将能量运输到控制器并执行升级操作
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
        creep.say('⚡ 升级');
    }

    // 工作状态：升级控制器
    if (creep.memory.working) {
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {
                visualizePathStyle: { stroke: '#ffffff' },
                reusePath: 5
            });
        }
    } else {
        // 采集状态：优先从存储结构获取能量
        const energySources = [
            // 1. 优先从Storage获取
            ...creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_STORAGE &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
            }),
            // 2. 从容器获取
            ...creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER &&
                           s.store.getUsedCapacity(RESOURCE_ENERGY) > 500
            }),
            // 3. 从掉落能量获取
            ...creep.room.find(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            })
        ];

        if (energySources.length > 0) {
            const target = energySources[0];
            let actionResult;

            // 根据目标类型执行不同的获取动作
            if (target instanceof Resource) {
                actionResult = creep.pickup(target);
            } else {
                actionResult = creep.withdraw(target, RESOURCE_ENERGY);
            }

            if (actionResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: '#ffaa00' },
                    reusePath: 5
                });
            }
        } else {
            // 如果没有可用存储能量，直接采集资源
            const sources = creep.room.find(FIND_SOURCES);
            const targetSource = sources[0];

            if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSource, {
                    visualizePathStyle: { stroke: '#ffaa00' },
                    reusePath: 5
                });
            }
        }
    }
};