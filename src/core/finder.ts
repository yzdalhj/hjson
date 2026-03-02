/**
 * 深度查找功能
 * 支持多种查找模式：条件查找、路径查找、模式匹配等
 */

import type { 
  NodeValue, 
  Path, 
  NodeInfo, 
  FindCondition, 
  FindOptions 
} from '../types';
import { bfs, dfs } from './traverser';

/** 判断是否为对象 */
function isRealObject(value: NodeValue): value is Record<string, NodeValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 判断是否为数组 */
function isArray(value: NodeValue): value is NodeValue[] {
  return Array.isArray(value);
}

/**
 * 检查值是否匹配条件
 */
function matchesCondition<T = NodeValue>(
  info: NodeInfo<T>,
  condition: FindCondition<T>
): boolean {
  // 函数条件
  if (typeof condition === 'function') {
    return condition(info);
  }
  
  // 正则条件
  if (condition instanceof RegExp) {
    return condition.test(String(info.value));
  }
  
  // 字符串或数字条件（匹配key或value）
  if (typeof condition === 'string' || typeof condition === 'number') {
    return info.key === condition || info.value === condition;
  }
  
  // 对象条件（部分匹配）
  if (isRealObject(condition)) {
    const infoRecord = info as unknown as Record<string, unknown>;
    for (const [key, val] of Object.entries(condition)) {
      if (infoRecord[key] !== val) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

/**
 * 查找单个节点
 * @param root 根节点
 * @param condition 查找条件
 * @param options 查找选项
 * @returns 找到的节点信息，未找到返回undefined
 */
export function find<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options: FindOptions = {}
): NodeInfo<T> | undefined {
  const { mode = 'dfs', order = 'pre', maxDepth } = options;
  let result: NodeInfo<T> | undefined;
  
  const callback = (info: NodeInfo<T>): boolean => {
    if (matchesCondition(info, condition)) {
      result = info;
      return false; // 中断遍历
    }
    return true;
  };
  
  if (mode === 'bfs') {
    bfs(root, callback, { maxDepth });
  } else {
    dfs(root, callback, { order, maxDepth });
  }
  
  return result;
}

/**
 * 查找所有匹配的节点
 * @param root 根节点
 * @param condition 查找条件
 * @param options 查找选项
 * @returns 所有匹配的节点信息数组
 */
export function findAll<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options: FindOptions = {}
): NodeInfo<T>[] {
  const { mode = 'dfs', order = 'pre', maxDepth, maxResults } = options;
  const results: NodeInfo<T>[] = [];
  
  const callback = (info: NodeInfo<T>): boolean => {
    if (matchesCondition(info, condition)) {
      results.push(info);
      if (maxResults && results.length >= maxResults) {
        return false; // 达到最大结果数，中断遍历
      }
    }
    return true;
  };
  
  if (mode === 'bfs') {
    bfs(root, callback, { maxDepth });
  } else {
    dfs(root, callback, { order, maxDepth });
  }
  
  return results;
}

/**
 * 通过路径查找值
 * @param root 根节点
 * @param path 路径数组
 * @returns 找到的值，未找到返回undefined
 */
export function findByPath<T = NodeValue>(
  root: T,
  path: Path
): NodeValue | undefined {
  let current: NodeValue = root;
  
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (isArray(current)) {
      if (typeof key !== 'number' || key < 0 || key >= current.length) {
        return undefined;
      }
      current = current[key];
    } else if (isRealObject(current)) {
      if (!(key in current)) {
        return undefined;
      }
      current = current[key as string];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * 通过路径查找值（支持点号路径）
 * @param root 根节点
 * @param path 点号分隔的路径字符串或路径数组
 * @returns 找到的值，未找到返回undefined
 */
export function get<T = NodeValue>(
  root: T,
  path: string | Path
): NodeValue | undefined {
  const pathArray: Path = typeof path === 'string' ? path.split('.') : path;
  return findByPath(root, pathArray);
}

/**
 * 检查是否存在符合条件的节点
 * @param root 根节点
 * @param condition 查找条件
 * @param options 查找选项
 * @returns 是否存在
 */
export function has<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options?: FindOptions
): boolean {
  return find(root, condition, options) !== undefined;
}

/**
 * 按key查找节点
 * @param root 根节点
 * @param key 要查找的key
 * @param options 查找选项
 * @returns 找到的节点信息
 */
export function findByKey<T = NodeValue>(
  root: T,
  key: string | number,
  options?: FindOptions
): NodeInfo<T> | undefined {
  return find(root, { key } as FindCondition<T>, options);
}

/**
 * 按value查找节点
 * @param root 根节点
 * @param value 要查找的value
 * @param options 查找选项
 * @returns 找到的节点信息
 */
export function findByValue<T = NodeValue>(
  root: T,
  value: unknown,
  options?: FindOptions
): NodeInfo<T> | undefined {
  return find(root, { value } as FindCondition<T>, options);
}

/**
 * 按深度查找节点
 * @param root 根节点
 * @param depth 目标深度
 * @param options 查找选项
 * @returns 该深度的所有节点
 */
export function findByDepth<T = NodeValue>(
  root: T,
  depth: number,
  options?: FindOptions
): NodeInfo<T>[] {
  return findAll(root, (info) => info.depth === depth, options);
}

/**
 * 查找父节点
 * @param root 根节点
 * @param condition 子节点的查找条件
 * @returns 父节点的信息
 */
export function findParent<T = NodeValue>(
  root: T,
  condition: FindCondition<T>
): NodeInfo<T> | undefined {
  const child = find(root, condition);
  if (!child || child.isRoot) {
    return undefined;
  }
  
  // 通过路径找到父节点
  const parentPath = child.path.slice(0, -1);
  const parentValue = findByPath(root, parentPath);
  
  if (parentValue === undefined) {
    return undefined;
  }
  
  const parentKey = child.path.length > 1 ? child.path[child.path.length - 2] : '';
  
  return {
    value: parentValue as T,
    key: parentKey,
    path: parentPath,
    depth: child.depth - 1,
    isRoot: parentPath.length === 0,
    isLeaf: !isRealObject(parentValue) && !isArray(parentValue)
  } as NodeInfo<T>;
}

/**
 * 查找兄弟节点
 * @param root 根节点
 * @param condition 目标节点的查找条件
 * @param options 查找选项
 * @returns 兄弟节点的信息数组
 */
export function findSiblings<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options?: FindOptions
): NodeInfo<T>[] {
  const target = find(root, condition, options);
  if (!target || target.isRoot) {
    return [];
  }
  
  const parentPath = target.path.slice(0, -1);
  const parent = findByPath(root, parentPath);
  
  if (!parent) {
    return [];
  }
  
  const siblings: NodeInfo<T>[] = [];
  const targetKey = target.path[target.path.length - 1];
  
  if (isArray(parent)) {
    for (let i = 0; i < parent.length; i++) {
      if (i !== targetKey) {
        const siblingPath = [...parentPath, i];
        siblings.push({
          value: parent[i] as T,
          key: i,
          path: siblingPath,
          depth: target.depth,
          parent,
          parentKey: target.parentKey,
          isRoot: false,
          isLeaf: !isRealObject(parent[i]) && !isArray(parent[i])
        });
      }
    }
  } else if (isRealObject(parent)) {
    for (const key of Object.keys(parent)) {
      if (key !== targetKey) {
        const siblingPath = [...parentPath, key];
        siblings.push({
          value: parent[key] as T,
          key,
          path: siblingPath,
          depth: target.depth,
          parent,
          parentKey: target.parentKey,
          isRoot: false,
          isLeaf: !isRealObject(parent[key]) && !isArray(parent[key])
        });
      }
    }
  }
  
  return siblings;
}

/**
 * 使用XPath风格的查询
 * @param root 根节点
 * @param query XPath风格查询字符串
 * @returns 找到的所有节点
 */
export function query<T = NodeValue>(
  root: T,
  query: string
): NodeInfo<T>[] {
  const parts = query.split('/').filter(p => p.length > 0);
  let results: NodeInfo<T>[] = [{
    value: root as T,
    key: '',
    path: [],
    depth: 0,
    isRoot: true,
    isLeaf: !isRealObject(root) && !isArray(root)
  }];
  
  for (const part of parts) {
    const newResults: NodeInfo<T>[] = [];
    
    for (const node of results) {
      const value = node.value;
      
      if (part === '*') {
        // 通配符：匹配所有子节点
        if (isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            newResults.push({
              value: value[i] as T,
              key: i,
              path: [...node.path, i],
              depth: node.depth + 1,
              parent: value,
              parentKey: i,
              isRoot: false,
              isLeaf: !isRealObject(value[i]) && !isArray(value[i])
            });
          }
        } else if (isRealObject(value)) {
          for (const key of Object.keys(value)) {
            newResults.push({
              value: value[key] as T,
              key,
              path: [...node.path, key],
              depth: node.depth + 1,
              parent: value,
              parentKey: key,
              isRoot: false,
              isLeaf: !isRealObject(value[key]) && !isArray(value[key])
            });
          }
        }
      } else if (part.startsWith('[') && part.endsWith(']')) {
        // 数组索引：[0], [1], 等
        const index = parseInt(part.slice(1, -1), 10);
        if (isArray(value) && index >= 0 && index < value.length) {
          newResults.push({
            value: value[index] as T,
            key: index,
            path: [...node.path, index],
            depth: node.depth + 1,
            parent: value,
            parentKey: index,
            isRoot: false,
            isLeaf: !isRealObject(value[index]) && !isArray(value[index])
          });
        }
      } else {
        // 具体key匹配
        if (isRealObject(value) && part in value) {
          newResults.push({
            value: value[part] as T,
            key: part,
            path: [...node.path, part],
            depth: node.depth + 1,
            parent: value,
            parentKey: part,
            isRoot: false,
            isLeaf: !isRealObject(value[part]) && !isArray(value[part])
          });
        }
      }
    }
    
    results = newResults;
    if (results.length === 0) break;
  }
  
  return results;
}

/**
 * 创建查找器对象
 * 提供面向对象的查找API
 */
export class Finder<T = NodeValue> {
  constructor(private root: T) {}
  
  /** 查找单个节点 */
  find(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T> | undefined {
    return find(this.root, condition, options);
  }
  
  /** 查找所有匹配的节点 */
  findAll(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[] {
    return findAll(this.root, condition, options);
  }
  
  /** 通过路径查找 */
  findByPath(path: Path): NodeValue | undefined {
    return findByPath(this.root, path);
  }
  
  /** 通过点号路径查找 */
  get(path: string | Path): NodeValue | undefined {
    return get(this.root, path);
  }
  
  /** 检查是否存在 */
  has(condition: FindCondition<T>, options?: FindOptions): boolean {
    return has(this.root, condition, options);
  }
  
  /** 按key查找 */
  findByKey(key: string | number, options?: FindOptions): NodeInfo<T> | undefined {
    return findByKey(this.root, key, options);
  }
  
  /** 按value查找 */
  findByValue(value: unknown, options?: FindOptions): NodeInfo<T> | undefined {
    return findByValue(this.root, value, options);
  }
  
  /** 按深度查找 */
  findByDepth(depth: number, options?: FindOptions): NodeInfo<T>[] {
    return findByDepth(this.root, depth, options);
  }
  
  /** 查找父节点 */
  findParent(condition: FindCondition<T>): NodeInfo<T> | undefined {
    return findParent(this.root, condition);
  }
  
  /** 查找兄弟节点 */
  findSiblings(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[] {
    return findSiblings(this.root, condition, options);
  }
  
  /** XPath风格查询 */
  query(queryStr: string): NodeInfo<T>[] {
    return query(this.root, queryStr);
  }
  
  /** 获取根节点 */
  getRoot(): T {
    return this.root;
  }
}

export default {
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
};
