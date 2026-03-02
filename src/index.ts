/**
 * HJSON Topology Toolkit
 * 强大的HJSON/JSON拓扑结构处理工具包
 */

// 类型导出
export * from './types';

// 核心模块导出
export * from './core/traverser';
export * from './core/finder';
export * from './core/transformer';
export * from './core/validator';
export * from './core/hjson';

// 链式API导出
export { chain, Chain } from './chain';

// 引入必要的类型和函数
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
  TraverseMode,
  TraverseCallback,
  MapFunction,
  FilterFunction,
  ReduceFunction,
  ReplaceFunction,
  ChainAPI
} from './types';

import { 
  bfs, 
  dfs, 
  traverse, 
  getChildren, 
  getDepth, 
  getLeafCount,
  getLevels,
  getStats,
  Traverser,
  isObject as isObj
} from './core/traverser';

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
} from './core/finder';

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
} from './core/transformer';

import {
  validate,
  validateSync,
  createValidator,
  Validator
} from './core/validator';

import {
  parse,
  parseSync,
  parseSafe,
  stringify,
  stringifySync,
  load,
  save,
  convertJSONtoHJSON,
  convertHJSONtoJSON,
  isHJSON,
  format,
  minify,
  HJSON
} from './core/hjson';

import { chain, Chain } from './chain';

// ============================================
// 顶层便捷函数
// ============================================

/** 
 * 解析HJSON/JSON字符串为对象
 */
export function parseHJSON(text: string, options?: { keepWsc?: boolean }): NodeValue {
  return parseSync(text, options);
}

/** 
 * 将对象序列化为HJSON字符串
 */
export function stringifyHJSON(value: NodeValue, options?: { bracesSameLine?: boolean; space?: string | number }): string {
  return stringifySync(value, options);
}

/** 
 * 深度克隆对象
 */
export function deepClone<T = NodeValue>(obj: T): T {
  return clone(obj) as T;
}

/** 
 * 深度合并多个对象
 */
export function merge<T = NodeValue>(...objects: T[]): T {
  return deepMerge(...objects);
}

/** 
 * 判断是否为对象
 */
export function isObject(value: NodeValue): value is Record<string, NodeValue> {
  return isObj(value);
}

/** 
 * 判断是否为数组
 */
export function isArray(value: NodeValue): value is NodeValue[] {
  return Array.isArray(value);
}

/** 
 * 获取对象路径值
 */
export function getValue<T = NodeValue>(obj: T, path: string | Path): NodeValue | undefined {
  return get(obj, path);
}

/** 
 * 设置对象路径值
 */
export function setValue<T extends Record<string, NodeValue>>(
  obj: T, 
  path: string | Path, 
  value: NodeValue
): T {
  const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
  const result = clone(obj) as T;
  let current: NodeValue = result;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (current === null || current === undefined) {
      return result;
    }
    
    if (typeof key === 'number') {
      if (!Array.isArray(current)) {
        return result;
      }
      current = current[key];
    } else {
      if (!isObj(current)) {
        return result;
      }
      current = current[key];
    }
  }
  
  const lastKey = pathArray[pathArray.length - 1];
  if (isObj(current) && typeof lastKey === 'string') {
    current[lastKey] = value;
  } else if (Array.isArray(current) && typeof lastKey === 'number') {
    current[lastKey] = value;
  }
  
  return result;
}

/** 
 * 删除对象路径值
 */
export function removeValue<T extends Record<string, NodeValue>>(
  obj: T, 
  path: string | Path
): T {
  const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
  const result = clone(obj) as T;
  let current: NodeValue = result;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    if (current === null || current === undefined) {
      return result;
    }
    
    if (typeof key === 'number') {
      if (!Array.isArray(current)) {
        return result;
      }
      current = current[key];
    } else {
      if (!isObj(current)) {
        return result;
      }
      current = current[key];
    }
  }
  
  const lastKey = pathArray[pathArray.length - 1];
  if (isObj(current) && typeof lastKey === 'string') {
    delete current[lastKey];
  } else if (Array.isArray(current) && typeof lastKey === 'number') {
    current.splice(lastKey, 1);
  }
  
  return result;
}

// ============================================
// 默认导出
// ============================================

export default {
  // 遍历
  bfs,
  dfs,
  traverse,
  getChildren,
  getDepth,
  getLeafCount,
  getLevels,
  getStats,
  Traverser,
  
  // 查找
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
  Finder,
  
  // 转换
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
  Transform,
  
  // 验证
  validate,
  validateSync,
  createValidator,
  Validator,
  
  // HJSON
  parse,
  parseSafe,
  stringify,
  load,
  save,
  convertJSONtoHJSON,
  convertHJSONtoJSON,
  isHJSON,
  format,
  minify,
  HJSON,
  
  // 便捷函数
  parseHJSON,
  stringifyHJSON,
  deepClone,
  merge,
  isObject,
  isArray,
  getValue,
  setValue,
  removeValue,
  
  // 链式API
  chain,
  Chain
};
