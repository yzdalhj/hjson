/**
 * 异步遍历功能
 */

import type { NodeValue, Path, AsyncNodeInfo, AsyncTraverseCallback } from '../types';

/** 判断是否为对象 */
function isObject(value: NodeValue): value is Record<string, NodeValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 判断是否为数组 */
function isArray(value: NodeValue): value is NodeValue[] {
  return Array.isArray(value);
}

/** 判断是否为叶子节点 */
function isLeaf(value: NodeValue): boolean {
  return !isObject(value) && !isArray(value);
}

/**
 * 创建异步节点信息
 */
function createAsyncNodeInfo<T = NodeValue>(
  value: T,
  key: string | number,
  path: Path,
  depth: number,
  parent?: NodeValue,
  parentKey?: string | number,
  abortSignal?: AbortSignal
): AsyncNodeInfo<T> {
  return {
    value,
    key,
    path,
    depth,
    parent,
    parentKey,
    isRoot: depth === 0,
    isLeaf: isLeaf(value as NodeValue),
    abortSignal
  };
}

/**
 * 异步 BFS 遍历
 * @param root 根节点
 * @param callback 异步回调函数
 * @param options 选项
 */
export async function asyncBFS<T = NodeValue>(
  root: T,
  callback: AsyncTraverseCallback<T>,
  options: { maxDepth?: number; abortSignal?: AbortSignal; concurrency?: number } = {}
): Promise<void> {
  const { maxDepth = Infinity, abortSignal, concurrency = Infinity } = options;
  
  if (abortSignal?.aborted) {
    return;
  }
  
  if (isLeaf(root)) {
    await callback(createAsyncNodeInfo(root as T, '', [], 0, undefined, undefined, abortSignal));
    return;
  }

  const queue: Array<{ value: NodeValue; key: string | number; path: Path; depth: number; parent: NodeValue }> = [];
  
  // 初始化队列
  if (isArray(root)) {
    for (let i = 0; i < root.length; i++) {
      queue.push({ value: root[i], key: i, path: [i], depth: 1, parent: root });
    }
  } else if (isObject(root)) {
    for (const key of Object.keys(root)) {
      queue.push({ value: root[key], key, path: [key], depth: 1, parent: root });
    }
  }

  // 处理根节点
  const shouldContinue = await callback(createAsyncNodeInfo(root as T, '', [], 0, undefined, undefined, abortSignal));
  if (shouldContinue === false || abortSignal?.aborted) return;

  // 并发控制
  let running = 0;
  const semaphore: Promise<void>[] = [];

  while (queue.length > 0) {
    if (abortSignal?.aborted) break;
    
    const item = queue.shift()!;
    
    if (item.depth > maxDepth) continue;
    
    const info = createAsyncNodeInfo(
      item.value as T,
      item.key,
      item.path,
      item.depth,
      item.parent,
      item.key,
      abortSignal
    );
    
    const task = (async () => {
      running++;
      const result = await callback(info);
      
      // 将子节点加入队列
      if (result !== false && !abortSignal?.aborted && item.depth < maxDepth) {
        if (isArray(item.value)) {
          for (let i = 0; i < item.value.length; i++) {
            queue.push({
              value: item.value[i],
              key: i,
              path: [...item.path, i],
              depth: item.depth + 1,
              parent: item.value
            });
          }
        } else if (isObject(item.value)) {
          for (const key of Object.keys(item.value)) {
            queue.push({
              value: item.value[key],
              key,
              path: [...item.path, key],
              depth: item.depth + 1,
              parent: item.value
            });
          }
        }
      }
      running--;
    })();
    
    if (concurrency === Infinity) {
      await task;
    } else {
      semaphore.push(task);
      if (semaphore.length >= concurrency) {
        await Promise.race(semaphore);
        semaphore.splice(0, semaphore.filter(p => p === task).length);
      }
    }
  }
  
  await Promise.all(semaphore);
}

/**
 * 异步 DFS 遍历
 * @param root 根节点
 * @param callback 异步回调函数
 * @param options 选项
 */
export async function asyncDFS<T = NodeValue>(
  root: T,
  callback: AsyncTraverseCallback<T>,
  options: { order?: 'pre' | 'post'; maxDepth?: number; abortSignal?: AbortSignal } = {}
): Promise<void> {
  const { order = 'pre', maxDepth = Infinity, abortSignal } = options;
  
  async function traverse(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): Promise<boolean> {
    if (abortSignal?.aborted) return false;
    if (depth > maxDepth) return true;
    
    const isLeafNode = isLeaf(value);
    const info = createAsyncNodeInfo(value as T, key, path, depth, parent, key, abortSignal);
    
    // 前序遍历
    if (order === 'pre') {
      const result = await callback(info);
      if (result === false) return false;
    }
    
    // 递归遍历子节点
    if (!isLeafNode && depth < maxDepth) {
      if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const shouldContinue = await traverse(value[i], i, [...path, i], depth + 1, value);
          if (!shouldContinue) return false;
        }
      } else if (isObject(value)) {
        for (const k of Object.keys(value)) {
          const shouldContinue = await traverse(value[k], k, [...path, k], depth + 1, value);
          if (!shouldContinue) return false;
        }
      }
    }
    
    // 后序遍历
    if (order === 'post') {
      const result = await callback(info);
      if (result === false) return false;
    }
    
    return true;
  }
  
  await traverse(root, '', [], 0, undefined as unknown as NodeValue);
}

/**
 * 异步通用遍历
 * @param root 根节点
 * @param callback 异步回调函数
 * @param mode 遍历模式
 * @param options 选项
 */
export async function asyncTraverse<T = NodeValue>(
  root: T,
  callback: AsyncTraverseCallback<T>,
  mode: 'bfs' | 'dfs' = 'dfs',
  options?: { order?: 'pre' | 'post'; maxDepth?: number; abortSignal?: AbortSignal; concurrency?: number }
): Promise<void> {
  if (mode === 'bfs') {
    await asyncBFS(root, callback, options);
  } else {
    await asyncDFS(root, callback, options as { order?: 'pre' | 'post'; maxDepth?: number; abortSignal?: AbortSignal });
  }
}

export default {
  asyncBFS,
  asyncDFS,
  asyncTraverse
};
