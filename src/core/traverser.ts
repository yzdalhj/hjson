/**
 * 拓扑遍历引擎
 * 支持BFS（广度优先）和DFS（深度优先）两种遍历模式
 */

import type { 
  NodeValue, 
  Path, 
  NodeInfo, 
  TraverseMode, 
  TraverseOrder, 
  TraverseCallback 
} from '../types';

/** 判断是否为对象（不包括null） */
export function isObject(value: NodeValue): value is Record<string, NodeValue> {
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
 * 创建节点信息对象
 */
function createNodeInfo<T = NodeValue>(
  value: T,
  key: string | number,
  path: Path,
  depth: number,
  parent?: NodeValue,
  parentKey?: string | number
): NodeInfo<T> {
  return {
    value,
    key,
    path,
    depth,
    parent,
    parentKey,
    isRoot: depth === 0,
    isLeaf: isLeaf(value as NodeValue)
  };
}

/**
 * 广度优先遍历（BFS）
 * @param root 根节点
 * @param callback 回调函数，返回false可中断遍历
 * @param options 遍历选项
 */
export function bfs<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  options: { maxDepth?: number } = {}
): void {
  const { maxDepth = Infinity } = options;
  
  if (isLeaf(root)) {
    callback(createNodeInfo(root as T, '', [], 0, undefined, undefined));
    return;
  }

  const queue: Array<{ value: NodeValue; key: string | number; path: Path; depth: number; parent: NodeValue }> = [];
  
  // 初始化队列
  if (isArray(root)) {
    for (let i = 0; i < root.length; i++) {
      queue.push({
        value: root[i],
        key: i,
        path: [i],
        depth: 1,
        parent: root
      });
    }
  } else if (isObject(root)) {
    for (const key of Object.keys(root)) {
      queue.push({
        value: root[key],
        key,
        path: [key],
        depth: 1,
        parent: root
      });
    }
  }

  // 处理根节点
  const shouldContinue = callback(createNodeInfo(root as T, '', [], 0, undefined, undefined));
  if (shouldContinue === false) return;

  while (queue.length > 0) {
    const item = queue.shift()!;
    
    if (item.depth > maxDepth) continue;
    
    const info = createNodeInfo(
      item.value as T,
      item.key,
      item.path,
      item.depth,
      item.parent,
      item.key
    );
    
    const result = callback(info);
    if (result === false) break;
    
    // 将子节点加入队列
    if (isArray(item.value) && item.depth < maxDepth) {
      for (let i = 0; i < item.value.length; i++) {
        queue.push({
          value: item.value[i],
          key: i,
          path: [...item.path, i],
          depth: item.depth + 1,
          parent: item.value
        });
      }
    } else if (isObject(item.value) && item.depth < maxDepth) {
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
}

/**
 * 深度优先遍历（DFS）
 * @param root 根节点
 * @param callback 回调函数，返回false可中断遍历
 * @param options 遍历选项
 */
export function dfs<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  options: { order?: TraverseOrder; maxDepth?: number } = {}
): void {
  const { order = 'pre', maxDepth = Infinity } = options;
  
  function traverse(
    value: NodeValue,
    key: string | number,
    path: Path,
    depth: number,
    parent: NodeValue
  ): boolean {
    if (depth > maxDepth) return true;
    
    const isLeafNode = isLeaf(value);
    const info = createNodeInfo(value as T, key, path, depth, parent, key);
    
    // 前序遍历：先访问节点
    if (order === 'pre') {
      const result = callback(info);
      if (result === false) return false;
    }
    
    // 递归遍历子节点
    if (!isLeafNode && depth < maxDepth) {
      if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const shouldContinue = traverse(value[i], i, [...path, i], depth + 1, value);
          if (!shouldContinue) return false;
        }
      } else if (isObject(value)) {
        for (const k of Object.keys(value)) {
          const shouldContinue = traverse(value[k], k, [...path, k], depth + 1, value);
          if (!shouldContinue) return false;
        }
      }
    }
    
    // 后序遍历：后访问节点
    if (order === 'post') {
      const result = callback(info);
      if (result === false) return false;
    }
    
    return true;
  }
  
  traverse(root, '', [], 0, undefined as unknown as NodeValue);
}

/**
 * 通用遍历函数
 * @param root 根节点
 * @param callback 回调函数
 * @param mode 遍历模式：'bfs' 或 'dfs'
 * @param options 遍历选项
 */
export function traverse<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  mode: TraverseMode = 'dfs',
  options: { order?: TraverseOrder; maxDepth?: number } = {}
): void {
  if (mode === 'bfs') {
    bfs(root, callback, options);
  } else {
    dfs(root, callback, options);
  }
}

/**
 * 获取节点的所有子节点
 * @param value 节点值
 * @returns 子节点数组
 */
export function getChildren(value: NodeValue): Array<{ key: string | number; value: NodeValue }> {
  const children: Array<{ key: string | number; value: NodeValue }> = [];
  
  if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      children.push({ key: i, value: value[i] });
    }
  } else if (isObject(value)) {
    for (const key of Object.keys(value)) {
      children.push({ key, value: value[key] });
    }
  }
  
  return children;
}

/**
 * 获取节点的深度
 * @param root 根节点
 * @returns 最大深度
 */
export function getDepth(root: NodeValue): number {
  let maxDepth = 0;
  
  dfs(root, (info) => {
    if (info.depth > maxDepth) {
      maxDepth = info.depth;
    }
  });
  
  return maxDepth;
}

/**
 * 获取节点的叶子数量
 * @param root 根节点
 * @returns 叶子节点数量
 */
export function getLeafCount(root: NodeValue): number {
  let count = 0;
  
  dfs(root, (info) => {
    if (info.isLeaf) {
      count++;
    }
  });
  
  return count;
}

/**
 * 获取节点的层级结构
 * @param root 根节点
 * @returns 层级映射
 */
export function getLevels(root: NodeValue): Map<number, NodeInfo[]> {
  const levels = new Map<number, NodeInfo[]>();
  
  dfs(root, (info) => {
    if (!levels.has(info.depth)) {
      levels.set(info.depth, []);
    }
    levels.get(info.depth)!.push(info);
  });
  
  return levels;
}

/**
 * 遍历器的统计信息
 */
export interface TraverserStats {
  nodeCount: number;
  leafCount: number;
  maxDepth: number;
  avgBranchingFactor: number;
}

/**
 * 获取遍历器统计信息
 * @param root 根节点
 * @returns 统计信息
 */
export function getStats(root: NodeValue): TraverserStats {
  let nodeCount = 0;
  let leafCount = 0;
  let maxDepth = 0;
  let totalBranches = 0;
  let branchNodes = 0;
  
  dfs(root, (info) => {
    nodeCount++;
    if (info.isLeaf) {
      leafCount++;
    } else {
      const children = getChildren(info.value);
      if (children.length > 0) {
        totalBranches += children.length;
        branchNodes++;
      }
    }
    if (info.depth > maxDepth) {
      maxDepth = info.depth;
    }
  });
  
  return {
    nodeCount,
    leafCount,
    maxDepth,
    avgBranchingFactor: branchNodes > 0 ? totalBranches / branchNodes : 0
  };
}

/**
 * 创建遍历器对象
 * 提供面向对象的遍历API
 */
export class Traverser<T = NodeValue> {
  constructor(private root: T) {}
  
  /** 执行BFS遍历 */
  bfs(callback: TraverseCallback<T>, options?: { maxDepth?: number }): this {
    bfs(this.root, callback, options);
    return this;
  }
  
  /** 执行DFS遍历 */
  dfs(callback: TraverseCallback<T>, options?: { order?: TraverseOrder; maxDepth?: number }): this {
    dfs(this.root, callback, options);
    return this;
  }
  
  /** 通用遍历 */
  traverse(callback: TraverseCallback<T>, mode: TraverseMode = 'dfs', options?: { order?: TraverseOrder; maxDepth?: number }): this {
    traverse(this.root, callback, mode, options);
    return this;
  }
  
  /** 获取深度 */
  getDepth(): number {
    return getDepth(this.root as NodeValue);
  }
  
  /** 获取叶子数量 */
  getLeafCount(): number {
    return getLeafCount(this.root as NodeValue);
  }
  
  /** 获取统计信息 */
  getStats(): TraverserStats {
    return getStats(this.root as NodeValue);
  }
  
  /** 获取层级结构 */
  getLevels(): Map<number, NodeInfo[]> {
    return getLevels(this.root as NodeValue);
  }
  
  /** 获取根节点 */
  getRoot(): T {
    return this.root;
  }
}

export default {
  bfs,
  dfs,
  traverse,
  getChildren,
  getDepth,
  getLeafCount,
  getLevels,
  getStats,
  Traverser
};
