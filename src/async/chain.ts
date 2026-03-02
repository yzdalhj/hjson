/**
 * 异步链式 API
 */

import type { 
  NodeValue,
  AsyncNodeInfo,
  AsyncFindOptions,
  ReplaceOptions,
  AsyncTraverseCallback,
  AsyncMapFunction,
  AsyncFilterFunction,
  AsyncReduceFunction,
  AsyncReplaceFunction,
  AsyncFindCondition
} from '../types';

import { clone } from '../core/transformer';
import { asyncBFS, asyncDFS } from './traverse';
import { asyncFind, asyncFindAll } from './find';
import { asyncMap, asyncFilter, asyncReduce, asyncReplace, asyncReplaceAll } from './transform';

/**
 * 异步链式 API 类
 */
export class AsyncChain<T = NodeValue> {
  private data: T;
  
  constructor(data: T) {
    this.data = clone(data);
  }
  
  /**
   * 创建异步链式实例
   */
  static of<T>(data: T): AsyncChain<T> {
    return new AsyncChain(data);
  }
  
  // ============================================
  // 遍历方法
  // ============================================
  
  /**
   * 异步遍历
   */
  async forEach(callback: AsyncTraverseCallback<T>, options?: { abortSignal?: AbortSignal }): Promise<this> {
    await asyncDFS(this.data, callback, options);
    return this;
  }
  
  /**
   * 异步 BFS 遍历
   */
  async forEachBFS(callback: AsyncTraverseCallback<T>, options?: { concurrency?: number; abortSignal?: AbortSignal }): Promise<this> {
    await asyncBFS(this.data, callback, options);
    return this;
  }
  
  /**
   * 异步 DFS 遍历
   */
  async forEachDFS(callback: AsyncTraverseCallback<T>, options?: { order?: 'pre' | 'post'; abortSignal?: AbortSignal }): Promise<this> {
    await asyncDFS(this.data, callback, options);
    return this;
  }
  
  // ============================================
  // 转换方法
  // ============================================
  
  /**
   * 异步映射
   */
  async map<R>(callback: AsyncMapFunction<T, R>, options?: { abortSignal?: AbortSignal }): Promise<AsyncChain<R>> {
    const result = await asyncMap(this.data, callback, options);
    return new AsyncChain(result as unknown as R);
  }
  
  /**
   * 异步过滤
   */
  async filter(callback: AsyncFilterFunction<T>, options?: { abortSignal?: AbortSignal }): Promise<this> {
    this.data = await asyncFilter(this.data, callback, options);
    return this;
  }
  
  /**
   * 异步归约
   */
  async reduce<R>(callback: AsyncReduceFunction<T, R>, initial: R, options?: { abortSignal?: AbortSignal }): Promise<R> {
    return asyncReduce(this.data, callback, initial, options);
  }
  
  // ============================================
  // 查找方法
  // ============================================
  
  /**
   * 异步查找单个节点
   */
  async find(condition: AsyncFindCondition<T>, options?: AsyncFindOptions): Promise<AsyncNodeInfo<T> | undefined> {
    return asyncFind(this.data, condition, options);
  }
  
  /**
   * 异步查找所有匹配的节点
   */
  async findAll(condition: AsyncFindCondition<T>, options?: AsyncFindOptions): Promise<AsyncNodeInfo<T>[]> {
    return asyncFindAll(this.data, condition, options);
  }
  
  // ============================================
  // 替换方法
  // ============================================
  
  /**
   * 异步替换单个节点
   */
  async replace(
    condition: AsyncFindCondition<T>,
    replacement: AsyncReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions & { abortSignal?: AbortSignal }
  ): Promise<this> {
    this.data = await asyncReplace(this.data, condition, replacement, options);
    return this;
  }
  
  /**
   * 异步替换所有匹配节点
   */
  async replaceAll(
    condition: AsyncFindCondition<T>,
    replacement: AsyncReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions & { abortSignal?: AbortSignal }
  ): Promise<this> {
    this.data = await asyncReplaceAll(this.data, condition, replacement, options);
    return this;
  }
  
  // ============================================
  // 实用方法
  // ============================================
  
  /**
   * 获取数据
   */
  value(): T {
    return this.data;
  }
  
  /**
   * 转为 Promise
   */
  async toPromise(): Promise<T> {
    return this.data;
  }
  
  /**
   * 克隆
   */
  clone(): AsyncChain<T> {
    return new AsyncChain(clone(this.data));
  }
  
  /**
   * 管道操作
   */
  async pipe<R>(fn: (data: T) => Promise<R> | R): Promise<AsyncChain<R>> {
    const result = await fn(this.data);
    return new AsyncChain(result);
  }
}

/**
 * 创建异步链式实例
 */
export function asyncChain<T = NodeValue>(data: T): AsyncChain<T> {
  return new AsyncChain(data);
}

export default {
  AsyncChain,
  asyncChain
};
