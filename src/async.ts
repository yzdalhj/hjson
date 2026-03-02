/**
 * 异步操作入口
 * 提供异步遍历、查找、转换等功能
 * 
 * @example
 * ```typescript
 * import { asyncChain, asyncFind, asyncMap } from 'hjson-topology-toolkit/async';
 * 
 * const result = await asyncChain(data)
 *   .map(async (info) => await transform(info.value))
 *   .filter(async (info) => await isValid(info.value))
 *   .value();
 * ```
 */

// 从子模块重新导出所有内容
export * from './async/traverse';
export * from './async/find';
export * from './async/transform';
export * from './async/chain';

// 默认导出
import { asyncTraverse, asyncBFS, asyncDFS } from './async/traverse';
import { asyncFind, asyncFindAll } from './async/find';
import { asyncMap, asyncFilter, asyncReduce, asyncReplace, asyncReplaceAll } from './async/transform';
import { AsyncChain, asyncChain } from './async/chain';

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
