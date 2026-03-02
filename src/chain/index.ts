/**
 * 链式 API
 * 提供流畅的接口进行数据操作
 */

import type { 
  NodeValue, 
  Path, 
  NodeInfo,
  FindCondition,
  FindOptions,
  ReplaceOptions,
  FlattenOptions,
  ValidationOptions,
  ValidationResult,
  TraverseCallback,
  MapFunction,
  FilterFunction,
  ReduceFunction,
  ReplaceFunction,
  ChainAPI,
  HJSONStringifyOptions
} from '../types';

import { 
  bfs, 
  dfs, 
  getDepth, 
  getLeafCount, 
  getStats, 
  Traverser 
} from '../core/traverser';

import { 
  find, 
  findAll, 
  findByPath, 
  get, 
  has,
  findByKey,
  findByValue,
  findByDepth,
  findParent,
  findSiblings,
  query,
  Finder 
} from '../core/finder';

import {
  map,
  filter,
  reduce,
  replace,
  replaceAll,
  flatten,
  unflatten,
  clone,
  deepMerge,
  pick,
  omit,
  Transform
} from '../core/transformer';

import {
  validate,
  validateSync,
  createValidator,
  Validator
} from '../core/validator';

import {
  stringifySync,
  HJSON
} from '../core/hjson';

/** 判断是否为对象 */
function isObject(value: NodeValue): value is Record<string, NodeValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 判断是否为数组 */
function isArray(value: NodeValue): value is NodeValue[] {
  return Array.isArray(value);
}

/**
 * 链式 API 实现类
 */
export class Chain<T = NodeValue> implements ChainAPI<T> {
  private data: T;
  
  constructor(data: T) {
    this.data = clone(data);
  }
  
  /**
   * 创建链式实例
   */
  static of<T>(data: T): Chain<T> {
    return new Chain(data);
  }
  
  /**
   * 从 HJSON 字符串创建
   */
  static fromHJSON<T = NodeValue>(text: string): Chain<T> {
    const data = JSON.parse(text) as T;
    return new Chain(data);
  }
  
  /**
   * 从 JSON 字符串创建
   */
  static fromJSON<T = NodeValue>(text: string): Chain<T> {
    const data = JSON.parse(text) as T;
    return new Chain(data);
  }
  
  // ============================================
  // 遍历方法
  // ============================================
  
  /**
   * 遍历每个节点
   */
  forEach(callback: TraverseCallback<T>): this {
    dfs(this.data, callback);
    return this;
  }
  
  /**
   * BFS 遍历
   */
  forEachBFS(callback: TraverseCallback<T>): this {
    bfs(this.data, callback);
    return this;
  }
  
  /**
   * DFS 遍历
   */
  forEachDFS(callback: TraverseCallback<T>, order?: 'pre' | 'post'): this {
    dfs(this.data, callback, { order });
    return this;
  }
  
  /**
   * 深度映射
   */
  map<R>(callback: MapFunction<T, R>): Chain<R> {
    const result = map(this.data, callback);
    return new Chain(result as unknown as R);
  }
  
  /**
   * 深度过滤
   */
  filter(callback: FilterFunction<T>): this {
    this.data = filter(this.data, callback) as T;
    return this;
  }
  
  /**
   * 深度归约
   */
  reduce<R>(callback: ReduceFunction<T, R>, initial: R): R {
    return reduce(this.data, callback, initial);
  }
  
  // ============================================
  // 查找方法
  // ============================================
  
  /**
   * 查找单个节点
   */
  find(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T> | undefined {
    return find(this.data, condition, options);
  }
  
  /**
   * 查找所有匹配节点
   */
  findAll(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[] {
    return findAll(this.data, condition, options);
  }
  
  /**
   * 通过路径查找
   */
  findPath(path: Path): NodeValue | undefined {
    return findByPath(this.data, path);
  }
  
  /**
   * 通过点号路径获取值
   */
  get(path: string | Path): NodeValue | undefined {
    return get(this.data, path);
  }
  
  /**
   * 检查是否存在
   */
  has(condition: FindCondition<T>, options?: FindOptions): boolean {
    return has(this.data, condition, options);
  }
  
  /**
   * 按 key 查找
   */
  findByKey(key: string | number, options?: FindOptions): NodeInfo<T> | undefined {
    return findByKey(this.data, key, options);
  }
  
  /**
   * 按 value 查找
   */
  findByValue(value: unknown, options?: FindOptions): NodeInfo<T> | undefined {
    return findByValue(this.data, value, options);
  }
  
  /**
   * 按深度查找
   */
  findByDepth(depth: number, options?: FindOptions): NodeInfo<T>[] {
    return findByDepth(this.data, depth, options);
  }
  
  /**
   * 查找父节点
   */
  findParent(condition: FindCondition<T>): NodeInfo<T> | undefined {
    return findParent(this.data, condition);
  }
  
  /**
   * 查找兄弟节点
   */
  findSiblings(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[] {
    return findSiblings(this.data, condition, options);
  }
  
  /**
   * XPath 风格查询
   */
  query(queryStr: string): NodeInfo<T>[] {
    return query(this.data, queryStr);
  }
  
  // ============================================
  // 替换方法
  // ============================================
  
  /**
   * 替换单个匹配节点
   */
  replace(
    condition: FindCondition<T>,
    replacement: ReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions
  ): this {
    this.data = replace(this.data, condition, replacement, options);
    return this;
  }
  
  /**
   * 替换所有匹配节点
   */
  replaceAll(
    condition: FindCondition<T>,
    replacement: ReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions
  ): this {
    this.data = replaceAll(this.data, condition, replacement, options);
    return this;
  }
  
  /**
   * 设置路径值
   */
  set(path: string | Path, value: NodeValue): this {
    const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
    const result = clone(this.data) as Record<string, NodeValue>;
    let current: NodeValue = result;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (isArray(current) && typeof key === 'number') {
        current = current[key];
      } else if (isObject(current) && typeof key === 'string') {
        current = current[key];
      }
    }
    
    const lastKey = pathArray[pathArray.length - 1];
    if (isArray(current) && typeof lastKey === 'number') {
      current[lastKey] = value;
    } else if (isObject(current) && typeof lastKey === 'string') {
      current[lastKey] = value;
    }
    
    this.data = result as T;
    return this;
  }
  
  /**
   * 删除路径值
   */
  remove(path: string | Path): this {
    const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
    const result = clone(this.data) as Record<string, NodeValue>;
    let current: NodeValue = result;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (isArray(current) && typeof key === 'number') {
        current = current[key];
      } else if (isObject(current) && typeof key === 'string') {
        current = current[key];
      }
    }
    
    const lastKey = pathArray[pathArray.length - 1];
    if (isArray(current) && typeof lastKey === 'number') {
      current.splice(lastKey, 1);
    } else if (isObject(current) && typeof lastKey === 'string') {
      delete current[lastKey];
    }
    
    this.data = result as T;
    return this;
  }
  
  // ============================================
  // 转换方法
  // ============================================
  
  /**
   * 扁平化
   */
  flatten(options?: FlattenOptions): Record<string, NodeValue> {
    return flatten(this.data, options);
  }
  
  /**
   * 从扁平化恢复
   */
  unflatten(flatData: Record<string, NodeValue>, delimiter?: string): this {
    this.data = unflatten(flatData, { delimiter }) as unknown as T;
    return this;
  }
  
  /**
   * 克隆
   */
  clone(): Chain<T> {
    return new Chain(clone(this.data));
  }
  
  /**
   * 合并其他数据
   */
  merge(...others: T[]): this {
    this.data = deepMerge(this.data, ...others);
    return this;
  }
  
  /**
   * 选取指定路径
   */
  pick(paths: (string | Path)[]): this {
    this.data = pick(this.data, paths) as T;
    return this;
  }
  
  /**
   * 排除指定路径
   */
  omit(paths: (string | Path)[]): this {
    this.data = omit(this.data, paths) as T;
    return this;
  }
  
  // ============================================
  // 验证方法
  // ============================================
  
  /**
   * 验证数据（异步）
   */
  async validate(schema: unknown, options?: ValidationOptions): Promise<ValidationResult> {
    return validate(this.data, schema, options);
  }
  
  /**
   * 验证数据（同步）
   */
  validateSync(schema: unknown, options?: ValidationOptions): ValidationResult {
    return validateSync(this.data, schema, options);
  }
  
  /**
   * 检查是否通过验证
   */
  isValid(schema: unknown): boolean {
    const result = validateSync(this.data, schema);
    return result.valid;
  }
  
  // ============================================
  // 实用方法
  // ============================================
  
  /**
   * 获取原始值
   */
  value(): T {
    return this.data;
  }
  
  /**
   * 转换为 JSON 字符串
   */
  toJSON(space?: string | number): string {
    return JSON.stringify(this.data, null, space ?? 2);
  }
  
  /**
   * 转换为 HJSON 字符串
   */
  toHJSON(options?: HJSONStringifyOptions): string {
    try {
      return stringifySync(this.data, options);
    } catch {
      return this.toJSON(options?.space);
    }
  }
  
  /**
   * 转换为对象
   */
  toObject(): T {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  /**
   * 检查是否为数组
   */
  isArray(): boolean {
    return isArray(this.data);
  }
  
  /**
   * 检查是否为对象
   */
  isObject(): boolean {
    return isObject(this.data);
  }
  
  /**
   * 检查是否为空
   */
  isEmpty(): boolean {
    if (this.data === null || this.data === undefined) {
      return true;
    }
    if (isArray(this.data)) {
      return this.data.length === 0;
    }
    if (isObject(this.data)) {
      return Object.keys(this.data).length === 0;
    }
    return false;
  }
  
  /**
   * 获取大小（数组长度或对象键数）
   */
  size(): number {
    if (isArray(this.data)) {
      return this.data.length;
    }
    if (isObject(this.data)) {
      return Object.keys(this.data).length;
    }
    return 0;
  }
  
  /**
   * 获取所有键
   */
  keys(): string[] {
    if (isObject(this.data)) {
      return Object.keys(this.data);
    }
    return [];
  }
  
  /**
   * 获取所有值
   */
  values(): NodeValue[] {
    if (isArray(this.data)) {
      return [...this.data];
    }
    if (isObject(this.data)) {
      return Object.values(this.data);
    }
    return [];
  }
  
  /**
   * 获取深度
   */
  depth(): number {
    return getDepth(this.data as NodeValue);
  }
  
  /**
   * 获取叶子节点数量
   */
  leafCount(): number {
    return getLeafCount(this.data as NodeValue);
  }
  
  /**
   * 获取统计信息
   */
  stats(): import('../core/traverser').TraverserStats {
    return getStats(this.data as NodeValue);
  }
  
  /**
   * 转换为 Traverser
   */
  toTraverser(): Traverser<T> {
    return new Traverser(this.data);
  }
  
  /**
   * 转换为 Finder
   */
  toFinder(): Finder<T> {
    return new Finder(this.data);
  }
  
  /**
   * 转换为 Transform
   */
  toTransform(): Transform<T> {
    return new Transform(this.data);
  }
  
  /**
   * 转换为 HJSON 类实例
   */
  toHJSONClass(): HJSON {
    return new HJSON(this.data);
  }
  
  /**
   * 管道操作 - 应用自定义转换
   */
  pipe<R>(fn: (data: T) => R): Chain<R> {
    return new Chain(fn(this.data));
  }
  
  /**
   * 条件执行
   */
  when(condition: boolean | ((data: T) => boolean), fn: (chain: this) => this): this {
    const shouldExecute = typeof condition === 'function' ? condition(this.data) : condition;
    if (shouldExecute) {
      return fn(this);
    }
    return this;
  }
  
  /**
   * 条件分支
   */
  if(condition: boolean | ((data: T) => boolean)): any {
    const self = this;
    const shouldExecute = typeof condition === 'function' ? condition(this.data) : condition;
    let executed = false;
    
    const thenFn = (fn: (chain: Chain<T>) => Chain<T>): any => {
      if (shouldExecute) {
        fn(self);
        executed = true;
      }
      return {
        else: (elseFn: (chain: Chain<T>) => Chain<T>) => {
          if (!executed) {
            elseFn(self);
          }
          return self;
        }
      };
    };
    
    return Object.assign(this, { then: thenFn });
  }
  
  /**
   * 获取遍历器
   */
  [Symbol.iterator](): Iterator<NodeInfo<T>> {
    const items: NodeInfo<T>[] = [];
    dfs(this.data, (info) => {
      items.push(info);
    });
    
    let index = 0;
    return {
      next(): IteratorResult<NodeInfo<T>> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

/**
 * 创建链式 API 实例
 * @param data 初始数据
 * @returns Chain 实例
 */
export function chain<T = NodeValue>(data: T): Chain<T> {
  return new Chain(data);
}

/**
 * 创建链式 API 实例的简写
 */
export function hjson<T = NodeValue>(data: T): Chain<T> {
  return new Chain(data);
}

export default {
  Chain,
  chain,
  hjson
};
