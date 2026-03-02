/**
 * 异步转换功能
 */

import type { 
  NodeValue, 
  Path, 
  AsyncNodeInfo,
  ReplaceOptions,
  AsyncMapFunction,
  AsyncFilterFunction,
  AsyncReduceFunction,
  AsyncReplaceFunction,
  AsyncFindCondition
} from '../types';
import { asyncTraverse } from './traverse';

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
 * 异步深度映射
 * @param root 根节点
 * @param callback 异步映射函数
 * @param options 选项
 * @returns 映射后的新对象
 */
export async function asyncMap<T = NodeValue, R = NodeValue>(
  root: T,
  callback: AsyncMapFunction<T, R>,
  options: { maxDepth?: number; concurrency?: number; abortSignal?: AbortSignal } = {}
): Promise<R> {
  const { maxDepth = Infinity, abortSignal } = options;
  
  async function transform(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): Promise<NodeValue> {
    if (depth > maxDepth || abortSignal?.aborted) {
      return value;
    }
    
    const info = createAsyncNodeInfo(value as T, key, path, depth, parent, key, abortSignal);
    
    if (isLeaf(value)) {
      return (await callback(info)) as unknown as NodeValue;
    }
    
    let newValue: NodeValue;
    
    if (isArray(value)) {
      const promises = value.map((item, index) => 
        transform(item, index, [...path, index], depth + 1, value)
      );
      newValue = await Promise.all(promises);
    } else if (isObject(value)) {
      newValue = {};
      const entries = Object.entries(value);
      const results = await Promise.all(
        entries.map(async ([k, v]) => ({
          key: k,
          value: await transform(v, k, [...path, k], depth + 1, value)
        }))
      );
      for (const { key, value } of results) {
        (newValue as Record<string, NodeValue>)[key] = value;
      }
    } else {
      newValue = value;
    }
    
    return (await callback({ ...info, value: newValue as T })) as unknown as NodeValue;
  }
  
  return transform(root, '', [], 0, undefined as unknown as NodeValue) as Promise<R>;
}

/**
 * 异步深度过滤
 * @param root 根节点
 * @param callback 异步过滤函数
 * @param options 选项
 * @returns 过滤后的新对象
 */
export async function asyncFilter<T = NodeValue>(
  root: T,
  callback: AsyncFilterFunction<T>,
  options: { maxDepth?: number; abortSignal?: AbortSignal } = {}
): Promise<T> {
  const { maxDepth = Infinity, abortSignal } = options;
  
  async function doFilter(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): Promise<NodeValue | undefined> {
    if (depth > maxDepth || abortSignal?.aborted) {
      return value;
    }
    
    const info = createAsyncNodeInfo(value as T, key, path, depth, parent, key, abortSignal);
    const shouldKeep = await callback(info);
    
    if (isLeaf(value)) {
      return shouldKeep ? value : undefined;
    }
    
    if (isArray(value)) {
      const filtered = await Promise.all(
        value.map((item, index) => 
          doFilter(item, index, [...path, index], depth + 1, value)
        )
      );
      const newArray = filtered.filter((v): v is NodeValue => v !== undefined);
      return (shouldKeep || newArray.length > 0) ? newArray : undefined;
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      const entries = Object.entries(value);
      const filtered = await Promise.all(
        entries.map(async ([k, v]) => ({
          key: k,
          value: await doFilter(v, k, [...path, k], depth + 1, value)
        }))
      );
      for (const { key, value } of filtered) {
        if (value !== undefined) {
          newObj[key] = value;
        }
      }
      return (shouldKeep || Object.keys(newObj).length > 0) ? newObj : undefined;
    }
    
    return shouldKeep ? value : undefined;
  }
  
  const result = await doFilter(root, '', [], 0, undefined as unknown as NodeValue);
  return (result === undefined ? null : result) as T;
}

/**
 * 异步深度归约
 * @param root 根节点
 * @param callback 异步归约函数
 * @param initial 初始值
 * @param options 选项
 * @returns 归约结果
 */
export async function asyncReduce<T = NodeValue, R = NodeValue>(
  root: T,
  callback: AsyncReduceFunction<T, R>,
  initial: R,
  options: { mode?: 'bfs' | 'dfs'; maxDepth?: number; abortSignal?: AbortSignal } = {}
): Promise<R> {
  const { mode = 'dfs', maxDepth = Infinity, abortSignal } = options;
  let accumulator = initial;
  
  await asyncTraverse(root, async (info) => {
    accumulator = await callback(accumulator, info);
  }, mode, { maxDepth, abortSignal });
  
  return accumulator;
}

/**
 * 异步替换单个节点
 * @param root 根节点
 * @param condition 查找条件
 * @param replacement 替换函数
 * @param options 选项
 * @returns 替换后的新对象
 */
export async function asyncReplace<T = NodeValue>(
  root: T,
  condition: AsyncFindCondition<T>,
  replacement: AsyncReplaceFunction<T> | NodeValue,
  options: ReplaceOptions & { abortSignal?: AbortSignal } = {}
): Promise<T> {
  const { deep = true, maxDepth = Infinity, abortSignal } = options;
  let replaced = false;
  
  async function getReplacement(info: AsyncNodeInfo<T>): Promise<NodeValue | undefined> {
    if (typeof replacement === 'function') {
      return await (replacement as AsyncReplaceFunction<T>)(info);
    }
    return replacement;
  }
  
  async function doReplace(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): Promise<NodeValue> {
    if (depth > maxDepth || abortSignal?.aborted) {
      return value;
    }
    
    const info = createAsyncNodeInfo(value as T, key, path, depth, parent, key, abortSignal);
    
    if (!replaced && await condition(info)) {
      replaced = true;
      const newValue = await getReplacement(info);
      if (newValue !== undefined) {
        if (!deep || isLeaf(newValue)) {
          return newValue;
        }
        value = newValue;
      }
    }
    
    if (isArray(value)) {
      const results = await Promise.all(
        value.map((item, index) => 
          doReplace(item, index, [...path, index], depth + 1, value)
        )
      );
      return results;
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      const entries = Object.entries(value);
      const results = await Promise.all(
        entries.map(async ([k, v]) => ({
          key: k,
          value: await doReplace(v, k, [...path, k], depth + 1, value)
        }))
      );
      for (const { key, value } of results) {
        newObj[key] = value;
      }
      return newObj;
    }
    
    return value;
  }
  
  return doReplace(root, '', [], 0, undefined as unknown as NodeValue) as Promise<T>;
}

/**
 * 异步替换所有匹配节点
 * @param root 根节点
 * @param condition 查找条件
 * @param replacement 替换函数
 * @param options 选项
 * @returns 替换后的新对象
 */
export async function asyncReplaceAll<T = NodeValue>(
  root: T,
  condition: AsyncFindCondition<T>,
  replacement: AsyncReplaceFunction<T> | NodeValue,
  options: ReplaceOptions & { abortSignal?: AbortSignal } = {}
): Promise<T> {
  const { deep = true, maxDepth = Infinity, abortSignal } = options;
  
  async function getReplacement(info: AsyncNodeInfo<T>): Promise<NodeValue | undefined> {
    if (typeof replacement === 'function') {
      return await (replacement as AsyncReplaceFunction<T>)(info);
    }
    return replacement;
  }
  
  async function doReplace(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): Promise<NodeValue> {
    if (depth > maxDepth || abortSignal?.aborted) {
      return value;
    }
    
    const info = createAsyncNodeInfo(value as T, key, path, depth, parent, key, abortSignal);
    
    if (await condition(info)) {
      const newValue = await getReplacement(info);
      if (newValue !== undefined) {
        if (!deep || isLeaf(newValue)) {
          return newValue;
        }
        value = newValue;
      }
    }
    
    if (isArray(value)) {
      const results = await Promise.all(
        value.map((item, index) => 
          doReplace(item, index, [...path, index], depth + 1, value)
        )
      );
      return results;
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      const entries = Object.entries(value);
      const results = await Promise.all(
        entries.map(async ([k, v]) => ({
          key: k,
          value: await doReplace(v, k, [...path, k], depth + 1, value)
        }))
      );
      for (const { key, value } of results) {
        newObj[key] = value;
      }
      return newObj;
    }
    
    return value;
  }
  
  return doReplace(root, '', [], 0, undefined as unknown as NodeValue) as Promise<T>;
}

export default {
  asyncMap,
  asyncFilter,
  asyncReduce,
  asyncReplace,
  asyncReplaceAll
};
