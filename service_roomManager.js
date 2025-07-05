/**
 * 房间管理器模块
 * 负责房间状态监控、资源分配和升级规划
 */
module.exports = function() {
    // 遍历所有已拥有的房间
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!room.controller || !room.controller.my) continue;

        // 更新房间内存数据
        updateRoomMemory(room);

        // 管理房间能量状态
        manageEnergy(room);

        // 管理控制器升级
        manageControllerUpgrade(room);

        // 管理建筑队列
        manageConstructionSites(room);
    }

    /**
     * 初始化新资源点的能量传输链
     * @param {Source} source - 资源点对象
     * @param {Room} room - 房间对象
     */
    function initNewChain(source, room) {
        // 规划从资源点到基地的路径（基地默认位置为房间中心）
        const basePos = new RoomPosition(25, 25, room.name);
        const path = PathFinder.search(
            source.pos,
            { pos: basePos, range: 3 },
            { maxRooms: 1, plainCost: 1, swampCost: 5 }
        ).path;

        // 每5步设置一个节点（至少保证链头和链尾）
        const nodeStep = 5;
        const nodePositions = [];
        for (let i = 0; i < path.length; i += nodeStep) {
            nodePositions.push({ x: path[i].x, y: path[i].y });
        }

        // 确保链尾节点靠近基地
        if (nodePositions.length === 0 || !nodePositions[nodePositions.length - 1].isEqualTo(basePos)) {
            nodePositions.push({ x: basePos.x, y: basePos.y });
        }

        // 创建能量链记录
        Memory.energyChains[source.id] = {
            sourceId: source.id,
            basePos: { x: basePos.x, y: basePos.y, roomName: room.name },
            nodePositions: nodePositions,
            creepNames: new Array(nodePositions.length).fill('') // 初始化空Creep名称数组
        };

        console.log(`为资源点 ${source.id} 创建新能量链，节点数量: ${nodePositions.length}`);
    }

    /**
     * 更新房间内存数据
     * @param {Room} room - 房间对象
     */
    function updateRoomMemory(room) {
        // 更新资源点信息
        const sources = room.find(FIND_SOURCES);
        Memory.rooms[room.name].sources = sources.map(s => s.id);

        // 为新资源点自动创建能量链
        sources.forEach(source => {
            if (!Memory.energyChains[source.id]) {
                initNewChain(source, room);
            }
        });

        Memory.rooms[room.name].minerals = room.find(FIND_MINERALS).map(m => m.id);
        Memory.rooms[room.name].controllerId = room.controller.id;

        // 更新建筑信息
        Memory.rooms[room.name].spawns = room.find(FIND_MY_SPAWNS).map(s => s.id);
        Memory.rooms[room.name].towers = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        }).map(t => t.id);

        // 更新建筑工地
        Memory.rooms[room.name].constructionSites = room.find(FIND_CONSTRUCTION_SITES).map(cs => cs.id);
    }

    /**
     * 管理房间能量状态
     * @param {Room} room - 房间对象
     */
    function manageEnergy(room) {
        const energyStats = {
            available: room.energyAvailable,
            capacity: room.energyCapacityAvailable,
            storage: room.storage ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0,
            containers: room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            }).reduce((sum, container) => sum + container.store.getUsedCapacity(RESOURCE_ENERGY), 0)
        };

        // 记录能量统计
        Memory.rooms[room.name].energyStats = energyStats;

        // 当能量充足时，考虑扩展能量收集结构
        if (energyStats.available === energyStats.capacity && energyStats.storage > 100000) {
            planAdditionalExtensions(room);
        }
    }

    /**
     * 管理控制器升级
     * @param {Room} room - 房间对象
     */
    function manageControllerUpgrade(room) {
        const controller = room.controller;
        if (!controller) return;

        // 记录控制器升级进度
        Memory.rooms[room.name].controllerProgress = {
            level: controller.level,
            progress: controller.progress,
            progressTotal: controller.progressTotal,
            ticksToDowngrade: controller.ticksToDowngrade
        };

        // 当控制器即将降级时提高升级优先级
        if (controller.ticksToDowngrade < 1000) {
            Memory.config.creepRoles.upgrader.priority = 0; // 最高优先级
        } else {
            Memory.config.creepRoles.upgrader.priority = 2; // 恢复正常优先级
        }
    }

    /**
     * 管理建筑队列
     * @param {Room} room - 房间对象
     */
    function manageConstructionSites(room) {
        // 如果没有建筑工地且资源充足，规划新建筑
        if (room.find(FIND_CONSTRUCTION_SITES).length === 0 &&
            room.energyAvailable === room.energyCapacityAvailable &&
            (room.storage ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0) > 50000) {

            // 优先建造扩展
            if (room.controller.level > room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_EXTENSION }
            }).length) {
                planExtension(room);
            } else if (room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_TOWER }
            }).length < Math.min(room.controller.level, 6)) {
                // 建造防御塔
                planTower(room);
            }
        }
    }

    /**
     * 规划新的扩展
     * @param {Room} room - 房间对象
     */
    function planExtension(room) {
        // 简化版：在Spawn附近寻找空位建造扩展
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        if (!spawn) return;

        // 在Spawn周围5格范围内寻找空位
        for (let dx = -5; dx <= 5; dx++) {
            for (let dy = -5; dy <= 5; dy++) {
                if (dx === 0 && dy === 0) continue;

                const pos = new RoomPosition(spawn.pos.x + dx, spawn.pos.y + dy, room.name);
                // 检查地形是否可建造
                const terrain = pos.lookFor(LOOK_TERRAIN)[0];
                if (terrain !== 'wall' && pos.createConstructionSite(STRUCTURE_EXTENSION) === OK) {
                    console.log(`在房间 ${room.name} 规划了新扩展: (${pos.x}, ${pos.y})`);
                    return;
                }
            }
        }
    }

    /**
     * 规划新的防御塔
     * @param {Room} room - 房间对象
     */
    function planTower(room) {
        // 在控制器附近建造防御塔
        const controller = room.controller;
        if (!controller) return;

        // 在控制器周围5格范围内寻找空位
        for (let dx = -5; dx <= 5; dx++) {
            for (let dy = -5; dy <= 5; dy++) {
                if (dx === 0 && dy === 0) continue;

                const pos = new RoomPosition(controller.pos.x + dx, controller.pos.y + dy, room.name);
                // 检查地形是否可建造
                const terrain = pos.lookFor(LOOK_TERRAIN)[0];
                if (terrain !== 'wall' && pos.createConstructionSite(STRUCTURE_TOWER) === OK) {
                    console.log(`在房间 ${room.name} 规划了新防御塔: (${pos.x}, ${pos.y})`);
                    return;
                }
            }
        }
    }

    /**
     * 规划额外的扩展
     * @param {Room} room - 房间对象
     */
    function planAdditionalExtensions(room) {
        // 当资源充足时，继续建造更多扩展
        const extensions = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        }).length;

        const maxExtensions = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];

        if (extensions < maxExtensions) {
            planExtension(room);
        }
    }
};