/**
 * Tower管理器模块
 * 控制防御塔自动执行维修、治疗和攻击操作
 */
module.exports = function() {
    // 遍历所有房间的防御塔
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });

        if (towers.length === 0) continue;

        // 获取房间配置
        const towerSettings = Memory.config.towerSettings || {
            repairThreshold: 0.7,
            attackPriority: ['invader', 'player', 'npc']
        };

        towers.forEach(tower => {
            // 1. 优先攻击敌人
            const hostiles = findHostilesByPriority(room, towerSettings.attackPriority);
            if (hostiles.length > 0) {
                tower.attack(hostiles[0]);
                return;
            }

            // 2. 治疗受伤友军
            const injuredCreep = room.find(FIND_MY_CREEPS, {
                filter: creep => creep.hits < creep.hitsMax
            }).sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)[0];

            if (injuredCreep) {
                tower.heal(injuredCreep);
                return;
            }

            // 3. 维修受损建筑
            const damagedStructure = findDamagedStructure(room, towerSettings.repairThreshold);
            if (damagedStructure) {
                tower.repair(damagedStructure);
                return;
            }

            // 4. 转移多余能量到Spawn或Extension
            if (tower.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                transferExcessEnergy(tower, room);
            }
        });
    }

    /**
     * 按优先级查找敌人
     * @param {Room} room - 房间对象
     * @param {string[]} priority - 敌人类型优先级
     * @returns {Creep[]} 敌人列表
     */
    function findHostilesByPriority(room, priority) {
        for (const type of priority) {
            const hostiles = room.find(FIND_HOSTILE_CREEPS, {
                filter: creep => {
                    if (type === 'invader') return creep.owner.username === 'Invader';
                    if (type === 'player') return creep.owner.username !== 'Invader' && creep.owner.username;
                    return true; // npc
                }
            });
            if (hostiles.length > 0) return hostiles;
        }
        return [];
    }

    /**
     * 查找需要维修的建筑
     * @param {Room} room - 房间对象
     * @param {number} threshold - 维修阈值(0-1)
     * @returns {Structure} 需要维修的建筑
     */
    function findDamagedStructure(room, threshold) {
        // 优先维修关键结构
        const criticalStructures = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.hits < s.hitsMax * threshold &&
                       (s.structureType === STRUCTURE_SPAWN ||
                        s.structureType === STRUCTURE_EXTENSION ||
                        s.structureType === STRUCTURE_TOWER ||
                        s.structureType === STRUCTURE_CONTROLLER)
        });

        if (criticalStructures.length > 0) {
            return criticalStructures.sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)[0];
        }

        // 维修其他结构
        const otherStructures = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.hits < s.hitsMax * threshold &&
                       s.structureType !== STRUCTURE_WALL &&
                       s.structureType !== STRUCTURE_RAMPART
        });

        return otherStructures.length > 0 ?
            otherStructures.sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)[0] : null;
    }

    /**
     * 转移多余能量到Spawn或Extension
     * @param {StructureTower} tower - 防御塔对象
     * @param {Room} room - 房间对象
     */
    function transferExcessEnergy(tower, room) {
        const targets = room.find(FIND_MY_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_SPAWN ||
                          s.structureType === STRUCTURE_EXTENSION) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (targets.length > 0) {
            tower.transfer(targets[0], RESOURCE_ENERGY);
        }
    }
};