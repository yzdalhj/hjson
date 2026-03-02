/**
 * 异步操作入口
 * 提供异步遍历、查找、转换等功能
 */

export * from './traverse';
export * from './find';
export * from './transform';

// 默认导出
import { asyncTraverse, asyncBFS, asyncDFS } from './traverse';
import { asyncFind, asyncFindAll } from './find';
import { asyncMap, asyncFilter, asyncReduce, asyncReplace, asyncReplaceAll } from './transform';
import { AsyncChain, asyncChain } from './chain';

export default {
  // 遍历
  asyncTraverse,
  asyncBFS,
  asyncDFS,
  
  // 查找
  asyncFind,
  asyncFindAll,
  
  // 转换
  asyncMap,
  asyncFilter,
  asyncReduce,
  asyncReplace,
  asyncReplaceAll,
  
  // 链式 API
  AsyncChain,
  asyncChain
};
