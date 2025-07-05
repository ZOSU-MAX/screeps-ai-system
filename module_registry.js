/**
 * 模块注册中心，统一管理所有模块的加载和访问
 * 解决Screeps平台不支持文件夹结构的限制
 */
module.exports = {
  /**
   * 已加载的模块缓存
   * @type {Object.<string, any>}
   */
  modules: {},

  /**
   * 加载并注册模块
   * @param {string} moduleName - 模块名称（不含.js扩展名）
   * @returns {object} 模块实例
   * @throws {Error} 当模块加载失败时抛出错误
   */
  require(moduleName) {
    if (!this.modules[moduleName]) {
      try {
        this.modules[moduleName] = require(moduleName);
        console.log(`[ModuleRegistry] Loaded module: ${moduleName}`);
      } catch (error) {
        console.error(`[ModuleRegistry] Failed to load module ${moduleName}:`, error);
        throw error;
      }
    }
    return this.modules[moduleName];
  },

  /**
   * 获取角色模块
   * @param {string} roleName - 角色名称（不带role_前缀）
   * @returns {object} 角色模块
   */
  getRole(roleName) {
    return this.require(`role_${roleName}`);
  },

  /**
   * 获取服务模块
   * @param {string} serviceName - 服务名称（不带service_前缀）
   * @returns {object} 服务模块
   */
  getService(serviceName) {
    return this.require(`service_${serviceName}`);
  },

  /**
   * 获取工具模块
   * @param {string} utilName - 工具名称（不带utils_前缀）
   * @returns {object} 工具模块
   */
  getUtil(utilName) {
    return this.require(`utils_${utilName}`);
  },

  /**
   * 初始化所有核心服务
   */
  initCoreServices() {
    const coreServices = ['roomManager', 'spawnManager', 'towerManager', 'taskManager'];
    coreServices.forEach(serviceName => {
      try {
        const service = this.getService(serviceName);
        if (typeof service.init === 'function') {
          service.init();
          console.log(`[ModuleRegistry] Initialized service: ${serviceName}`);
        }
      } catch (error) {
        console.error(`[ModuleRegistry] Failed to initialize service ${serviceName}:`, error);
      }
    });
  },

  /**
   * 运行所有服务的主逻辑
   */
  runAllServices() {
    const coreServices = ['roomManager', 'spawnManager', 'towerManager', 'taskManager'];
    coreServices.forEach(serviceName => {
      try {
        const service = this.getService(serviceName);
        if (typeof service.run === 'function') {
          service.run();
        }
      } catch (error) {
        console.error(`[ModuleRegistry] Failed to run service ${serviceName}:`, error);
      }
    });
  },

  /**
   * 获取所有可用的角色名称
   * @returns {string[]} 角色名称数组
   */
  getAllRoleNames() {
    return Object.keys(Game.creeps)
      .map(creepName => Game.creeps[creepName].memory.role)
      .filter((role, index, self) => self.indexOf(role) === index);
  },

  /**
   * 运行指定角色的逻辑
   * @param {Creep} creep - Creep实例
   */
  runRole(creep) {
    try {
      const roleModule = this.getRole(creep.memory.role);
      if (typeof roleModule.run === 'function') {
        roleModule.run(creep);
      } else {
        console.warn(`[ModuleRegistry] Role ${creep.memory.role} has no run method`);
      }
    } catch (error) {
      console.error(`[ModuleRegistry] Error running role ${creep.memory.role} for creep ${creep.name}:`, error);
    }
  }
};

// 在全局对象上暴露模块注册中心以便调试
if (typeof global !== 'undefined') {
  global.ModuleRegistry = module.exports;
}

/*
 * 模块注册中心，统一管理所有模块的加载和访问
 */
module.exports = {
  /**
   * 已加载的模块缓存
   */
  modules: {},

  /**
   * 加载并注册模块
   * @param {string} moduleName - 模块名称（不含.js扩展名）
   * @returns {object} 模块实例
   */
  require(moduleName) {
    if (!this.modules[moduleName]) {
      this.modules[moduleName] = require(moduleName);
    }
    return this.modules[moduleName];
  },

  /**
   * 获取角色模块
   * @param {string} roleName - 角色名称
   * @returns {object} 角色模块
   */
  getRole(roleName) {
    return this.require(`role_${roleName}`);
  },

  /**
   * 获取服务模块
   * @param {string} serviceName - 服务名称
   * @returns {object} 服务模块
   */
  getService(serviceName) {
    return this.require(`service_${serviceName}`);
  }
};