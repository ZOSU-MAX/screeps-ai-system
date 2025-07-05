/**
 * 日志工具
 */
module.exports = {
  /**
   * 错误日志
   * @param {string} message - 错误信息
   * @param {object} data - 附加数据
   */
  error(message, data = {}) {
    console.log(`[ERROR] ${Game.time}: ${message}`, data);
    // 可以添加内存日志记录
    if (!Memory.logs) Memory.logs = [];
    Memory.logs.push({
      type: 'error',
      time: Game.time,
      message,
      data
    });
    // 限制日志长度
    if (Memory.logs.length > 100) Memory.logs.shift();
  },

  // 其他日志级别...
};