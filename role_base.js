/**
 * 角色基类，封装所有角色的通用行为
 */
class RoleBase {
  /**
   * 构造函数
   * @param {Creep} creep -  creep 实例
   */
  constructor(creep) {
    this.creep = creep;
    this.memory = creep.memory;
  }

  /**
   * 移动到目标位置
   * @param {RoomPosition} target - 目标位置
   * @returns {boolean} 是否成功移动
   */
  moveToTarget(target) {
    if (!target) return false;
    return this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } }) === OK;
  }

  /**
   * 获取能量
   * @returns {boolean} 是否成功获取能量
   */
  getEnergy() {
    // 通用能量获取逻辑
    const sources = this.creep.room.find(FIND_SOURCES);
    if (this.creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
      this.moveToTarget(sources[0]);
    }
    return true;
  }

  // 其他通用方法...
}

module.exports = RoleBase;