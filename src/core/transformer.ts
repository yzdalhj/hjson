/**
 * 数据转换器
 * 支持映射、过滤、归约、替换、扁平化等操作
 */

import type { 
  NodeValue, 
  Path, 
  NodeInfo,
  MapFunction,
  FilterFunction,
  ReduceFunction,
  ReplaceFunction,
  FlattenOptions,
  ReplaceOptions,
  TraverseMode,
  TraverseCallback
} from '../types';

import { traverse, dfs, bfs } from './traverser';

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
 * 深度映射 - 遍历并转换每个节点
 * @param root 根节点
 * @param callback 映射函数
 * @param options 选项
 * @returns 映射后的新对象
 */
export function map<T = NodeValue, R = NodeValue>(
  root: T,
  callback: MapFunction<T, R>,
  options: { mode?: TraverseMode; maxDepth?: number } = {}
): T | R {
  const { mode = 'dfs', maxDepth = Infinity } = options;
  
  function transform(value: NodeValue, key: string | number, path: Path, depth: number, parent: NodeValue): NodeValue {
    if (depth > maxDepth) {
      return value;
    }
    
    const info: NodeInfo<T> = {
      value: value as T,
      key,
      path,
      depth,
      parent,
      parentKey: key,
      isRoot: depth === 0,
      isLeaf: isLeaf(value)
    };
    
    // 对叶子节点直接应用映射
    if (isLeaf(value)) {
      return callback(info) as NodeValue;
    }
    
    // 对容器节点，先映射子节点
    let newValue: NodeValue;
    
    if (isArray(value)) {
      newValue = value.map((item, index) => 
        transform(item, index, [...path, index], depth + 1, value)
      );
    } else if (isObject(value)) {
      newValue = {};
      for (const k of Object.keys(value)) {
        (newValue as Record<string, NodeValue>)[k] = transform(
          value[k], k, [...path, k], depth + 1, value
        );
      }
    } else {
      newValue = value;
    }
    
    // 然后对容器节点本身应用映射
    return callback({ ...info, value: newValue as T }) as NodeValue;
  }
  
  return transform(root, '', [], 0, undefined as unknown as NodeValue) as T | R;
}

/**
 * 深度过滤 - 保留满足条件的节点
 * @param root 根节点
 * @param callback 过滤函数
 * @param options 选项
 * @returns 过滤后的新对象
 */
export function filter<T = NodeValue>(
  root: T,
  callback: FilterFunction<T>,
  options: { mode?: TraverseMode; maxDepth?: number } = {}
): T {
  const { maxDepth = Infinity } = options;
  
  function doFilter(value: NodeValue, key: string | number, path: Path, depth: number, parent: NodeValue): NodeValue | undefined {
    if (depth > maxDepth) {
      return value;
    }
    
    const info: NodeInfo<T> = {
      value: value as T,
      key,
      path,
      depth,
      parent,
      parentKey: key,
      isRoot: depth === 0,
      isLeaf: isLeaf(value)
    };
    
    // 检查当前节点是否满足条件
    const shouldKeep = callback(info);
    
    if (isLeaf(value)) {
      return shouldKeep ? value : undefined;
    }
    
    if (isArray(value)) {
      const newArray: NodeValue[] = [];
      for (let i = 0; i < value.length; i++) {
        const filtered = doFilter(value[i], i, [...path, i], depth + 1, value);
        if (filtered !== undefined) {
          newArray.push(filtered);
        }
      }
      // 对于数组，如果父节点满足条件或子节点有保留的，就保留
      return (shouldKeep || newArray.length > 0) ? newArray : undefined;
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      for (const k of Object.keys(value)) {
        const filtered = doFilter(value[k], k, [...path, k], depth + 1, value);
        if (filtered !== undefined) {
          newObj[k] = filtered;
        }
      }
      // 对于对象，如果父节点满足条件或子节点有保留的，就保留
      return (shouldKeep || Object.keys(newObj).length > 0) ? newObj : undefined;
    }
    
    return shouldKeep ? value : undefined;
  }
  
  const result = doFilter(root, '', [], 0, undefined as unknown as NodeValue);
  return (result === undefined ? null : result) as T;
}

/**
 * 深度归约 - 遍历并累积结果
 * @param root 根节点
 * @param callback 归约函数
 * @param initial 初始值
 * @param options 选项
 * @returns 归约结果
 */
export function reduce<T = NodeValue, R = NodeValue>(
  root: T,
  callback: ReduceFunction<T, R>,
  initial: R,
  options: { mode?: TraverseMode; maxDepth?: number } = {}
): R {
  const { mode = 'dfs', maxDepth = Infinity } = options;
  let accumulator = initial;
  
  traverse(root, (info) => {
    accumulator = callback(accumulator, info);
  }, mode, { maxDepth });
  
  return accumulator;
}

/**
 * 替换单个节点
 * @param root 根节点
 * @param condition 查找条件或自定义函数
 * @param replacement 替换值或替换函数
 * @param options 选项
 * @returns 替换后的新对象
 */
export function replace<T = NodeValue>(
  root: T,
  condition: ((info: NodeInfo<T>) => boolean) | Partial<NodeInfo<T>> | string | number | RegExp,
  replacement: ReplaceFunction<T> | NodeValue,
  options: ReplaceOptions = {}
): T {
  const { deep = true, maxDepth = Infinity } = options;
  let replaced = false;
  
  function matches(info: NodeInfo<T>): boolean {
    if (typeof condition === 'function') {
      return (condition as (info: NodeInfo<T>) => boolean)(info);
    }
    if (condition instanceof RegExp) {
      return condition.test(String(info.key)) || condition.test(String(info.value));
    }
    if (typeof condition === 'string' || typeof condition === 'number') {
      return info.key === condition || info.value === condition;
    }
    // 部分匹配对象条件
    for (const [key, val] of Object.entries(condition)) {
      if ((info as unknown as Record<string, unknown>)[key] !== val) {
        return false;
      }
    }
    return true;
  }
  
  function getReplacement(info: NodeInfo<T>): NodeValue | undefined {
    if (typeof replacement === 'function') {
      return (replacement as ReplaceFunction<T>)(info);
    }
    return replacement;
  }
  
  function doReplace(value: NodeValue, key: string | number, path: Path, depth: number, parent: NodeValue): NodeValue {
    if (depth > maxDepth) {
      return value;
    }
    
    const info: NodeInfo<T> = {
      value: value as T,
      key,
      path,
      depth,
      parent,
      parentKey: key,
      isRoot: depth === 0,
      isLeaf: isLeaf(value)
    };
    
    // 检查是否匹配替换条件
    if (!replaced && matches(info)) {
      replaced = true;
      const newValue = getReplacement(info);
      if (newValue !== undefined) {
        // 如果不需要深替换，直接返回
        if (!deep || isLeaf(newValue)) {
          return newValue;
        }
        // 否则继续处理新值的子节点
        value = newValue;
      }
    }
    
    // 递归处理子节点
    if (isArray(value)) {
      return value.map((item, index) => 
        doReplace(item, index, [...path, index], depth + 1, value)
      );
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      for (const k of Object.keys(value)) {
        newObj[k] = doReplace(value[k], k, [...path, k], depth + 1, value);
      }
      return newObj;
    }
    
    return value;
  }
  
  return doReplace(root, '', [], 0, undefined as unknown as NodeValue) as T;
}

/**
 * 替换所有匹配的节点
 * @param root 根节点
 * @param condition 查找条件
 * @param replacement 替换值或替换函数
 * @param options 选项
 * @returns 替换后的新对象
 */
export function replaceAll<T = NodeValue>(
  root: T,
  condition: ((info: NodeInfo<T>) => boolean) | Partial<NodeInfo<T>> | string | number | RegExp,
  replacement: ReplaceFunction<T> | NodeValue,
  options: ReplaceOptions = {}
): T {
  const { deep = true, maxDepth = Infinity } = options;
  
  function matches(info: NodeInfo<T>): boolean {
    if (typeof condition === 'function') {
      return (condition as (info: NodeInfo<T>) => boolean)(info);
    }
    if (condition instanceof RegExp) {
      return condition.test(String(info.key)) || condition.test(String(info.value));
    }
    if (typeof condition === 'string' || typeof condition === 'number') {
      return info.key === condition || info.value === condition;
    }
    for (const [key, val] of Object.entries(condition)) {
      if ((info as unknown as Record<string, unknown>)[key] !== val) {
        return false;
      }
    }
    return true;
  }
  
  function getReplacement(info: NodeInfo<T>): NodeValue | undefined {
    if (typeof replacement === 'function') {
      return (replacement as ReplaceFunction<T>)(info);
    }
    return replacement;
  }
  
  function doReplace(value: NodeValue, key: string | number, path: Path, depth: number, parent: NodeValue): NodeValue {
    if (depth > maxDepth) {
      return value;
    }
    
    const info: NodeInfo<T> = {
      value: value as T,
      key,
      path,
      depth,
      parent,
      parentKey: key,
      isRoot: depth === 0,
      isLeaf: isLeaf(value)
    };
    
    // 检查是否匹配替换条件
    if (matches(info)) {
      const newValue = getReplacement(info);
      if (newValue !== undefined) {
        if (!deep || isLeaf(newValue)) {
          return newValue;
        }
        value = newValue;
      }
    }
    
    // 递归处理子节点
    if (isArray(value)) {
      return value.map((item, index) => 
        doReplace(item, index, [...path, index], depth + 1, value)
      );
    }
    
    if (isObject(value)) {
      const newObj: Record<string, NodeValue> = {};
      for (const k of Object.keys(value)) {
        newObj[k] = doReplace(value[k], k, [...path, k], depth + 1, value);
      }
      return newObj;
    }
    
    return value;
  }
  
  return doReplace(root, '', [], 0, undefined as unknown as NodeValue) as T;
}

/**
 * 扁平化对象
 * @param root 根节点
 * @param options 选项
 * @returns 扁平化后的对象
 */
export function flatten(
  root: NodeValue,
  options: FlattenOptions = {}
): Record<string, NodeValue> {
  const { 
    delimiter = '.', 
    maxDepth = Infinity,
    includeArrays = true 
  } = options;
  
  const result: Record<string, NodeValue> = {};
  
  function doFlatten(value: NodeValue, path: string, depth: number): void {
    if (depth >= maxDepth || isLeaf(value)) {
      result[path] = value;
      return;
    }
    
    if (isArray(value)) {
      if (!includeArrays) {
        result[path] = value;
        return;
      }
      for (let i = 0; i < value.length; i++) {
        const newPath = path ? `${path}${delimiter}${i}` : String(i);
        doFlatten(value[i], newPath, depth + 1);
      }
    } else if (isObject(value)) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        result[path] = value;
        return;
      }
      for (const key of keys) {
        const newPath = path ? `${path}${delimiter}${key}` : key;
        doFlatten(value[key], newPath, depth + 1);
      }
    } else {
      result[path] = value;
    }
  }
  
  doFlatten(root, '', 0);
  return result;
}

/**
 * 反扁平化对象
 * @param flatData 扁平化对象
 * @returns 恢复后的嵌套对象
 */
export function unflatten(
  flatData: Record<string, NodeValue>,
  options: { delimiter?: string } = {}
): NodeValue {
  const { delimiter = '.' } = options;
  
  if (Object.keys(flatData).length === 0) {
    return {};
  }
  
  // 检测是否为数组
  const keys = Object.keys(flatData);
  const isArrayResult = keys.every(key => /^\d+$/.test(key.split(delimiter)[0]));
  
  const result: NodeValue = isArrayResult ? [] : {};
  
  for (const [flatKey, value] of Object.entries(flatData)) {
    const parts = flatKey.split(delimiter);
    let current: NodeValue = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextArrayIndex = /^\d+$/.test(nextPart);
      const key = /^\d+$/.test(part) ? parseInt(part, 10) : part;
      
      if (isArray(current)) {
        if (current[key as number] === undefined) {
          current[key as number] = isNextArrayIndex ? [] : {};
        }
        current = current[key as number];
      } else {
        if ((current as Record<string, NodeValue>)[key] === undefined) {
          (current as Record<string, NodeValue>)[key] = isNextArrayIndex ? [] : {};
        }
        current = (current as Record<string, NodeValue>)[key];
      }
    }
    
    const lastKey = parts[parts.length - 1];
    if (isArray(current)) {
      current[parseInt(lastKey, 10)] = value;
    } else {
      (current as Record<string, NodeValue>)[lastKey] = value;
    }
  }
  
  return result;
}

/**
 * 深度克隆对象
 * @param value 要克隆的值
 * @returns 克隆后的值
 */
export function clone<T = NodeValue>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => clone(item)) as unknown as T;
  }
  
  if (typeof value === 'object') {
    const cloned: Record<string, NodeValue> = {};
    for (const key of Object.keys(value)) {
      cloned[key] = clone((value as Record<string, NodeValue>)[key]);
    }
    return cloned as T;
  }
  
  return value;
}

/**
 * 深度合并多个对象
 * @param objects 要合并的对象数组
 * @returns 合并后的对象
 */
export function deepMerge<T = NodeValue>(...objects: T[]): T {
  if (objects.length === 0) return {} as T;
  if (objects.length === 1) return clone(objects[0]);
  
  const [first, ...rest] = objects;
  
  function mergeTwo(target: NodeValue, source: NodeValue): NodeValue {
    if (source === null || source === undefined) {
      return target;
    }
    
    if (target === null || target === undefined) {
      return clone(source);
    }
    
    if (isArray(target) && isArray(source)) {
      return [...target, ...source];
    }
    
    if (isObject(target) && isObject(source)) {
      const result = { ...target };
      for (const key of Object.keys(source)) {
        if (key in result) {
          result[key] = mergeTwo(result[key], (source as Record<string, NodeValue>)[key]);
        } else {
          result[key] = clone((source as Record<string, NodeValue>)[key]);
        }
      }
      return result;
    }
    
    return clone(source);
  }
  
  return rest.reduce((acc, obj) => mergeTwo(acc, obj) as T, clone(first));
}

/**
 * 选取对象中的指定路径
 * @param obj 源对象
 * @param paths 要选取的路径数组
 * @returns 新对象，只包含指定的路径
 */
export function pick<T = NodeValue>(
  obj: T,
  paths: (string | Path)[]
): Partial<T> {
  const result: Record<string, NodeValue> = {};
  
  for (const path of paths) {
    const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
    let current: NodeValue = obj;
    let target: NodeValue = result;
    
    for (let i = 0; i < pathArray.length; i++) {
      const key = pathArray[i];
      const isLast = i === pathArray.length - 1;
      
      if (current === null || current === undefined) {
        break;
      }
      
      if (isLast) {
        if (isObject(target) && typeof key === 'string') {
          (target as Record<string, NodeValue>)[key] = clone(
            isArray(current) && typeof key === 'number' 
              ? current[key] 
              : (current as Record<string, NodeValue>)[key]
          );
        }
      } else {
        const nextKey = pathArray[i + 1];
        const isNextArrayIndex = typeof nextKey === 'number' || /^\d+$/.test(String(nextKey));
        
        if (isObject(target) && typeof key === 'string') {
          if ((target as Record<string, NodeValue>)[key] === undefined) {
            (target as Record<string, NodeValue>)[key] = isNextArrayIndex ? [] : {};
          }
          target = (target as Record<string, NodeValue>)[key];
          current = isArray(current) && typeof key === 'number'
            ? current[key]
            : (current as Record<string, NodeValue>)[key];
        }
      }
    }
  }
  
  return result as Partial<T>;
}

/**
 * 排除对象中的指定路径
 * @param obj 源对象
 * @param paths 要排除的路径数组
 * @returns 新对象，不包含指定的路径
 */
export function omit<T = NodeValue>(
  obj: T,
  paths: (string | Path)[]
): Partial<T> {
  const result = clone(obj) as Record<string, NodeValue>;
  
  for (const path of paths) {
    const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
    let current: NodeValue = result;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (current === null || current === undefined) {
        break;
      }
      
      if (isArray(current) && typeof key === 'number') {
        current = current[key];
      } else if (isObject(current) && typeof key === 'string') {
        current = current[key];
      } else {
        break;
      }
    }
    
    const lastKey = pathArray[pathArray.length - 1];
    if (current !== null && current !== undefined) {
      if (isArray(current) && typeof lastKey === 'number') {
        current.splice(lastKey, 1);
      } else if (isObject(current) && typeof lastKey === 'string') {
        delete (current as Record<string, NodeValue>)[lastKey];
      }
    }
  }
  
  return result as Partial<T>;
}

/**
 * 转换器类 - 提供面向对象的API
 */
export class Transform<T = NodeValue> {
  private data: T;
  
  constructor(data: T) {
    this.data = clone(data);
  }
  
  /** 深度映射 */
  map<R>(callback: MapFunction<T, R>, options?: { mode?: TraverseMode; maxDepth?: number }): Transform<R> {
    this.data = map(this.data, callback, options) as unknown as T;
    return this as unknown as Transform<R>;
  }
  
  /** 深度过滤 */
  filter(callback: FilterFunction<T>, options?: { mode?: TraverseMode; maxDepth?: number }): this {
    this.data = filter(this.data, callback, options) as T;
    return this;
  }
  
  /** 深度归约 */
  reduce<R>(callback: ReduceFunction<T, R>, initial: R, options?: { mode?: TraverseMode; maxDepth?: number }): R {
    return reduce(this.data, callback, initial, options);
  }
  
  /** 替换单个节点 */
  replace(
    condition: ((info: NodeInfo<T>) => boolean) | Partial<NodeInfo<T>> | string | number | RegExp,
    replacement: ReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions
  ): this {
    this.data = replace(this.data, condition, replacement, options);
    return this;
  }
  
  /** 替换所有匹配节点 */
  replaceAll(
    condition: ((info: NodeInfo<T>) => boolean) | Partial<NodeInfo<T>> | string | number | RegExp,
    replacement: ReplaceFunction<T> | NodeValue,
    options?: ReplaceOptions
  ): this {
    this.data = replaceAll(this.data, condition, replacement, options);
    return this;
  }
  
  /** 扁平化 */
  flatten(options?: FlattenOptions): Record<string, NodeValue> {
    return flatten(this.data, options);
  }
  
  /** 反扁平化 */
  unflatten(delimiter?: string): this {
    if (isObject(this.data)) {
      this.data = unflatten(this.data as Record<string, NodeValue>, { delimiter }) as unknown as T;
    }
    return this;
  }
  
  /** 深度克隆 */
  clone(): T {
    return clone(this.data);
  }
  
  /** 合并 */
  merge(...others: T[]): this {
    this.data = deepMerge(this.data, ...others);
    return this;
  }
  
  /** 选取 */
  pick(paths: (string | Path)[]): this {
    this.data = pick(this.data, paths) as T;
    return this;
  }
  
  /** 排除 */
  omit(paths: (string | Path)[]): this {
    this.data = omit(this.data, paths) as T;
    return this;
  }
  
  /** 获取值 */
  value(): T {
    return this.data;
  }
}

export default {
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
};
