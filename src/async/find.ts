/**
 * 异步查找功能
 */

import type { NodeValue, AsyncNodeInfo, AsyncFindOptions, AsyncFindCondition } from '../types';
import { asyncBFS, asyncDFS } from './traverse';

/**
 * 异步查找单个节点
 * @param root 根节点
 * @param condition 异步查找条件
 * @param options 选项
 * @returns 找到的节点信息
 */
export async function asyncFind<T = NodeValue>(
  root: T,
  condition: AsyncFindCondition<T>,
  options: AsyncFindOptions = {}
): Promise<AsyncNodeInfo<T> | undefined> {
  const { mode = 'dfs', order = 'pre', maxDepth, timeout, abortSignal } = options;
  
  let result: AsyncNodeInfo<T> | undefined;
  let timeoutId: NodeJS.Timeout | undefined;
  
  const timeoutPromise = timeout ? new Promise<void>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Search timeout')), timeout);
  }) : Promise.resolve();
  
  const searchPromise = (async () => {
    const callback = async (info: AsyncNodeInfo<T>): Promise<boolean> => {
      if (await condition(info)) {
        result = info;
        return false; // 中断遍历
      }
      return true;
    };
    
    if (mode === 'bfs') {
      await asyncBFS(root, callback, { maxDepth, abortSignal });
    } else {
      await asyncDFS(root, callback, { order, maxDepth, abortSignal });
    }
  })();
  
  await Promise.race([searchPromise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  
  return result;
}

/**
 * 异步查找所有匹配的节点
 * @param root 根节点
 * @param condition 异步查找条件
 * @param options 选项
 * @returns 所有匹配的节点信息数组
 */
export async function asyncFindAll<T = NodeValue>(
  root: T,
  condition: AsyncFindCondition<T>,
  options: AsyncFindOptions = {}
): Promise<AsyncNodeInfo<T>[]> {
  const { mode = 'dfs', order = 'pre', maxDepth, maxResults, abortSignal, concurrency } = options;
  const results: AsyncNodeInfo<T>[] = [];
  
  const callback = async (info: AsyncNodeInfo<T>): Promise<boolean> => {
    if (await condition(info)) {
      results.push(info);
      if (maxResults && results.length >= maxResults) {
        return false; // 达到最大结果数，中断遍历
      }
    }
    return true;
  };
  
  if (mode === 'bfs') {
    await asyncBFS(root, callback, { maxDepth, abortSignal, concurrency });
  } else {
    await asyncDFS(root, callback, { order, maxDepth, abortSignal });
  }
  
  return results;
}

export default {
  asyncFind,
  asyncFindAll
};
