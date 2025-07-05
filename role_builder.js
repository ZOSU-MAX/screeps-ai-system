/**
 * 建筑工角色模块
 * 负责建造建筑工地和维修受损结构
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
        creep.say('🏗️ 建造');
    }

    // 工作状态：建造或维修
    if (creep.memory.working) {
        // 优先建造建筑工地
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
            // 按优先级排序建筑工地（Spawn和Extension优先）
            const target = constructionSites.sort((a, b) => {
                const priorityA = a.structureType === STRUCTURE_SPAWN || a.structureType === STRUCTURE_EXTENSION ? 1 : 0;
                const priorityB = b.structureType === STRUCTURE_SPAWN || b.structureType === STRUCTURE_EXTENSION ? 1 : 0;
                return priorityB - priorityA;
            })[0];

            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: '#ffffff' },
                    reusePath: 5
                });
            }
            return;
        }

        // 没有建筑工地时维修受损结构
        const damagedStructures = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.hits < s.hitsMax &&
                       s.structureType !== STRUCTURE_WALL &&
                       s.structureType !== STRUCTURE_RAMPART
        });

        if (damagedStructures.length > 0) {
            // 优先维修关键结构
            const target = damagedStructures.sort((a, b) => {
                // 关键结构优先级
                const criticalStructures = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTROLLER];
                const priorityA = criticalStructures.includes(a.structureType) ? 1 : 0;
                const priorityB = criticalStructures.includes(b.structureType) ? 1 : 0;
                // 受损程度优先级
                const damageA = 1 - (a.hits / a.hitsMax);
                const damageB = 1 - (b.hits / b.hitsMax);
                return (priorityB - priorityA) || (damageB - damageA);
            })[0];

            if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, {
                    visualizePathStyle: { stroke: '#ffffff' },
                    reusePath: 5
                });
            }
        } else {
            // 没有建造或维修任务时协助升级控制器
            if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: { stroke: '#ffffff' },
                    reusePath: 5
                });
            }
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