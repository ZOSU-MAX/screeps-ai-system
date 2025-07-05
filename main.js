/**
 * Screeps全自动运维系统主入口文件
 * 负责初始化系统并执行主循环逻辑
 */
const ModuleRegistry = require('module_registry');

module.exports.loop = function () {
  // 初始化核心服务（首次运行时）
  if (!Memory.moduleRegistryInitialized) {
    ModuleRegistry.initCoreServices();
    Memory.moduleRegistryInitialized = true;
  }

  // 运行所有服务逻辑
  ModuleRegistry.runAllServices();

  // 清理内存
  require('memory_cleanup')();

  // 运行所有creep角色逻辑
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];
    ModuleRegistry.runRole(creep);
  }

  // 检查并生成新的creep
  ModuleRegistry.getService('spawnManager').spawnMissingCreeps();

    // 内存初始化与清理
    require('memory_init')();
    require('memory_cleanup')();

    // 运行核心服务
    require('service_spawnManager')();
    require('service_towerManager')();
    require('service_roomManager')();

    // 执行所有creep的角色逻辑
    for (let name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role && require('role_' + creep.memory.role)) {
            require('role_' + creep.memory.role)(creep);
        } else {
            console.log(`Creep ${name} has invalid role: ${creep.memory.role}`);
        }
    }
};