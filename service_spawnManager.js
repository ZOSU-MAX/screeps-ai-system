/**
 * Spawn管理器模块
 * 根据内存配置自动孵化和维持最优creep数量
 */
module.exports = function() {
    // 获取所有可用Spawn
    const spawns = Object.values(Game.spawns);
    if (spawns.length === 0) return;

    // 按优先级排序需要孵化的角色
    const rolesToSpawn = Object.entries(Memory.config.creepRoles)
        .sort((a, b) => a[1].priority - b[1].priority);

    // 检查每个Spawn的孵化状态
    spawns.forEach(spawn => {
        if (spawn.spawning) return;

        // 查找需要补充的角色
        for (const [roleName, roleConfig] of rolesToSpawn) {
            const currentCount = _.filter(Game.creeps, creep => creep.memory.role === roleName).length;

            if (currentCount < roleConfig.minCount) {
                // 计算房间可用能量
                const roomEnergy = spawn.room.energyAvailable;
                const maxEnergy = spawn.room.energyCapacityAvailable;
                const body = generateCreepBody(roleConfig.body, roomEnergy, maxEnergy);
                // 检查是否能生成有效的身体部件
                if (body.length === 0) {
                    console.log(`能量不足，无法孵化 ${roleName} (需要: ${baseCost}, 可用: ${roomEnergy})`);
                    continue;
                }
                const creepName = `${roleName}-${Game.time % 10000}`;

                // 尝试孵化creep
                const result = spawn.spawnCreep(body, creepName, {
                    memory: { role: roleName, working: false }
                });

                if (result === OK) {
                    console.log(`开始孵化 ${roleName}: ${creepName} (能量: ${roomEnergy}/${maxEnergy})`);
                    return;
                } else {
                    console.log(`孵化失败 ${roleName}: ${ErrorCodes[result]}`);
                }
            }
        }

        // 生成能量链节点Creep
        spawnChainWorkers(spawn);
    });

    /**
     * 生成能量链节点所需的Creep
     * @param {StructureSpawn} spawn - 当前Spawn
     */
    function spawnChainWorkers(spawn) {
        _.forOwn(Memory.energyChains, (chain, chainId) => {
            // 检查每个节点是否有对应的Creep
            chain.creepNames.forEach((creepName, nodeIndex) => {
                if (!Game.creeps[creepName]) {
                    // 确定节点角色
                    const role = nodeIndex === 0 ? 'harvestNode' : 
                                (nodeIndex === chain.nodePositions.length - 1 ? 'baseNode' : 'transferNode');

                    // 生成Creep名称
                    const newCreepName = `${chainId}_node${nodeIndex}_${Game.time % 10000}`;

                    // 基础身体部件配置
                    const bodyParts = [WORK, CARRY, MOVE, MOVE];
                    const bodyCost = bodyParts.reduce((sum, part) => sum + BODYPART_COST[part], 0);

                    // 检查能量是否足够
                    if (spawn.room.energyAvailable < bodyCost) {
                        console.log(`能量不足，无法生成 ${role} (需要: ${bodyCost}, 可用: ${spawn.room.energyAvailable})`);
                        return;
                    }

                    // 生成Creep
                    const result = spawn.spawnCreep(
                        bodyParts,
                        newCreepName,
                        {
                            memory: {
                                role: role,
                                chainId: chainId,
                                nodeIndex: nodeIndex,
                                targetIndex: nodeIndex + 1
                            }
                        }
                    );

                    if (result === OK) {
                        console.log(`生成 ${role} 节点: ${newCreepName} (链ID: ${chainId}, 节点索引: ${nodeIndex})`);
                        // 更新链中的Creep名称
                        chain.creepNames[nodeIndex] = newCreepName;
                    } else {
                        console.log(`生成 ${role} 节点失败: ${ErrorCodes[result]}`);
                    }
                }
            });
        });
    }

    /**
     * 根据可用能量生成creep身体部件
     * @param {string[]} baseBody - 基础身体部件配置
     * @param {number} energyAvailable - 当前可用能量
     * @param {number} energyCapacity - 最大能量容量
     * @returns {string[]} 生成的身体部件数组
     */
    function generateCreepBody(baseBody, energyAvailable, energyCapacity) {
        // 计算基础身体消耗
        const baseCost = baseBody.reduce((sum, part) => sum + BODYPART_COST[part], 0);
        if (energyAvailable < baseCost) return [];

        // 根据能量比例扩展身体部件
        const scaleFactor = Math.min(Math.floor(energyAvailable / baseCost), 5); // 限制最大缩放倍数
        let body = [];

        for (let i = 0; i < scaleFactor; i++) {
            body = body.concat(baseBody);
        }

        return body;
    }
};