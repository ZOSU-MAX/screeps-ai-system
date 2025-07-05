/**
 * 全局配置常量
 */
module.exports = {
  // 房间配置
  ROOM: {
    UPGRADE_PRIORITY: 1,
    BUILD_PRIORITY: 2,
    REPAIR_THRESHOLD: 0.7,
    ENERGY_THRESHOLD: 500
  },
  // Creep 配置
  CREEP: {
    MAX_SIZE: 50,
    SPAWN_INTERVAL: 300,
    // 身体部件配置
    BODYPARTS: {
      HARVESTER: [WORK, CARRY, MOVE],
      UPGRADER: [WORK, CARRY, MOVE],
      // 其他角色配置...
    }
  },
  // 能量链配置
  ENERGY_CHAIN: {
    NODE_DISTANCE: 3,
    MAX_LENGTH: 10,
    REBUILD_INTERVAL: 50
  }
};