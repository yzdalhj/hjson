/**
 * 拓扑工具包核心类型定义
 */

/** 节点值类型 */
export type NodeValue = unknown;

/** 树节点 */
export interface TreeNode {
  [key: string]: NodeValue;
}

/** 遍历模式 */
export type TraverseMode = 'bfs' | 'dfs';

/** 遍历顺序 */
export type TraverseOrder = 'pre' | 'post';

/** 节点路径 */
export type Path = (string | number)[];

/** 节点信息 */
export interface NodeInfo<T = NodeValue> {
  value: T;
  key: string | number;
  path: Path;
  depth: number;
  parent?: NodeValue;
  parentKey?: string | number;
  isRoot: boolean;
  isLeaf: boolean;
}

/** 遍历回调函数 */
export type TraverseCallback<T = NodeValue> = (
  info: NodeInfo<T>
) => void | boolean;

/** 查找条件 */
export type FindCondition<T = NodeValue> = 
  | ((info: NodeInfo<T>) => boolean)
  | Partial<NodeInfo<T>>
  | string
  | number
  | RegExp;

/** 查找选项 */
export interface FindOptions {
  mode?: TraverseMode;
  order?: TraverseOrder;
  maxDepth?: number;
  maxResults?: number;
}

/** 替换选项 */
export interface ReplaceOptions {
  deep?: boolean;
  mode?: TraverseMode;
  maxDepth?: number;
}

/** 替换函数 */
export type ReplaceFunction<T = NodeValue> = (
  info: NodeInfo<T>
) => NodeValue | undefined;

/** 映射函数 */
export type MapFunction<T = NodeValue, R = NodeValue> = (
  info: NodeInfo<T>
) => R;

/** 过滤函数 */
export type FilterFunction<T = NodeValue> = (
  info: NodeInfo<T>
) => boolean;

/** 归约函数 */
export type ReduceFunction<T = NodeValue, R = NodeValue> = (
  acc: R,
  info: NodeInfo<T>
) => R;

/** 扁平化选项 */
export interface FlattenOptions {
  delimiter?: string;
  maxDepth?: number;
  includeArrays?: boolean;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/** 验证错误 */
export interface ValidationError {
  message: string;
  path: string;
  value: NodeValue;
  schemaPath?: string;
}

/** Schema验证选项 */
export interface ValidationOptions {
  strict?: boolean;
  allErrors?: boolean;
  useDefaults?: boolean;
  coerceTypes?: boolean;
}

/** 链式API接口 */
export interface ChainAPI<T = NodeValue> {
  // 遍历方法
  forEach(callback: TraverseCallback<T>): ChainAPI<T>;
  map<R>(callback: MapFunction<T, R>): ChainAPI<R>;
  filter(callback: FilterFunction<T>): ChainAPI<T>;
  reduce<R>(callback: ReduceFunction<T, R>, initial: R): R;
  
  // 查找方法
  find(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T> | undefined;
  findAll(condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[];
  findPath(path: Path): NodeValue | undefined;
  
  // 替换方法
  replace(condition: FindCondition<T>, replacement: ReplaceFunction<T> | NodeValue, options?: ReplaceOptions): ChainAPI<T>;
  replaceAll(condition: FindCondition<T>, replacement: ReplaceFunction<T> | NodeValue, options?: ReplaceOptions): ChainAPI<T>;
  
  // 转换方法
  flatten(options?: FlattenOptions): Record<string, NodeValue>;
  unflatten(flatData: Record<string, NodeValue>, delimiter?: string): ChainAPI<T>;
  clone(): ChainAPI<T>;
  
  // 验证方法
  validate(schema: unknown, options?: ValidationOptions): Promise<ValidationResult>;
  validateSync(schema: unknown, options?: ValidationOptions): ValidationResult;
  
  // 实用方法
  value(): T;
  toJSON(): string;
  toHJSON(options?: { bracesSameLine?: boolean }): string;
  
  // 类型守卫
  isArray(): boolean;
  isObject(): boolean;
  isEmpty(): boolean;
  size(): number;
  keys(): string[];
  values(): NodeValue[];
}

/** 异步节点信息 */
export interface AsyncNodeInfo<T = NodeValue> extends NodeInfo<T> {
  abortSignal?: AbortSignal;
}

/** 异步遍历回调 */
export type AsyncTraverseCallback<T = NodeValue> = (
  info: AsyncNodeInfo<T>
) => Promise<void | boolean> | void | boolean;

/** 异步查找回调 */
export type AsyncFindCondition<T = NodeValue> = (
  info: AsyncNodeInfo<T>
) => Promise<boolean> | boolean;

/** 异步替换函数 */
export type AsyncReplaceFunction<T = NodeValue> = (
  info: AsyncNodeInfo<T>
) => Promise<NodeValue | undefined> | NodeValue | undefined;

/** 异步映射函数 */
export type AsyncMapFunction<T = NodeValue, R = NodeValue> = (
  info: AsyncNodeInfo<T>
) => Promise<R> | R;

/** 异步过滤函数 */
export type AsyncFilterFunction<T = NodeValue> = (
  info: AsyncNodeInfo<T>
) => Promise<boolean> | boolean;

/** 异步归约函数 */
export type AsyncReduceFunction<T = NodeValue, R = NodeValue> = (
  acc: R,
  info: AsyncNodeInfo<T>
) => Promise<R> | R;

/** 异步查找选项 */
export interface AsyncFindOptions extends FindOptions {
  concurrency?: number;
  timeout?: number;
  abortSignal?: AbortSignal;
}

/** 异步链式API接口 */
export interface AsyncChainAPI<T = NodeValue> {
  forEach(callback: AsyncTraverseCallback<T>): Promise<AsyncChainAPI<T>>;
  map<R>(callback: AsyncMapFunction<T, R>): Promise<AsyncChainAPI<R>>;
  filter(callback: AsyncFilterFunction<T>): Promise<AsyncChainAPI<T>>;
  reduce<R>(callback: AsyncReduceFunction<T, R>, initial: R): Promise<R>;
  
  find(condition: AsyncFindCondition<T>, options?: AsyncFindOptions): Promise<AsyncNodeInfo<T> | undefined>;
  findAll(condition: AsyncFindCondition<T>, options?: AsyncFindOptions): Promise<AsyncNodeInfo<T>[]>;
  
  replace(condition: AsyncFindCondition<T>, replacement: AsyncReplaceFunction<T> | NodeValue, options?: ReplaceOptions): Promise<AsyncChainAPI<T>>;
  replaceAll(condition: AsyncFindCondition<T>, replacement: AsyncReplaceFunction<T> | NodeValue, options?: ReplaceOptions): Promise<AsyncChainAPI<T>>;
  
  value(): T;
  toPromise(): Promise<T>;
}

/** HJSON解析选项 */
export interface HJSONParseOptions {
  keepWsc?: boolean;
  legacyRoot?: boolean;
}

/** HJSON序列化选项 */
export interface HJSONStringifyOptions {
  bracesSameLine?: boolean;
  keepWsc?: boolean;
  quotes?: 'min' | 'keys' | 'all' | 'strings';
  condense?: number;
  emitRootBraces?: boolean;
  separator?: boolean;
  space?: string | number;
  eol?: string;
  colors?: boolean;
}
