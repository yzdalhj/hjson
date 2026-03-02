# 查找 API

## find

查找单个匹配的节点。

```typescript
function find<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options?: FindOptions
): NodeInfo<T> | undefined
```

### 示例

```typescript
import { find } from 'hjson-topology-toolkit';

// 对象条件
const result = find(data, { key: 'name', value: 'Alice' });

// 函数条件
const result = find(data, (info) => info.depth > 2);

// 正则条件
const result = find(data, /^test_/);
```

## findAll

查找所有匹配的节点。

```typescript
function findAll<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  options?: FindOptions
): NodeInfo<T>[]
```

## get / findByPath

通过路径获取值。

```typescript
function get<T = NodeValue>(
  root: T,
  path: string | Path
): NodeValue | undefined

function findByPath<T = NodeValue>(
  root: T,
  path: Path
): NodeValue | undefined
```

### 示例

```typescript
import { get, findByPath } from 'hjson-topology-toolkit';

// 点号路径
const value = get(data, 'users.0.name');

// 数组路径
const value = get(data, ['users', 0, 'name']);
```

## query

XPath 风格查询。

```typescript
function query<T = NodeValue>(
  root: T,
  query: string
): NodeInfo<T>[]
```

### 示例

```typescript
import { query } from 'hjson-topology-toolkit';

// 查询所有用户的名字
const names = query(data, 'users/*/name');

// 查询特定索引
const first = query(data, 'users/[0]/name');
```

## 其他查找函数

```typescript
// 检查是否存在
function has<T>(root: T, condition: FindCondition<T>): boolean

// 按 key 查找
function findByKey<T>(root: T, key: string | number, options?: FindOptions): NodeInfo<T> | undefined

// 按 value 查找
function findByValue<T>(root: T, value: unknown, options?: FindOptions): NodeInfo<T> | undefined

// 按深度查找
function findByDepth<T>(root: T, depth: number, options?: FindOptions): NodeInfo<T>[]

// 查找父节点
function findParent<T>(root: T, condition: FindCondition<T>): NodeInfo<T> | undefined

// 查找兄弟节点
function findSiblings<T>(root: T, condition: FindCondition<T>, options?: FindOptions): NodeInfo<T>[]
```

## Finder 类

```typescript
import { Finder } from 'hjson-topology-toolkit';

const finder = new Finder(data);

finder
  .find(condition)
  .findAll(condition)
  .get('path.to.value')
  .query('users/*/name');
```

## FindOptions

```typescript
interface FindOptions {
  mode?: 'bfs' | 'dfs';      // 遍历模式
  order?: 'pre' | 'post';    // 遍历顺序（仅 DFS）
  maxDepth?: number;         // 最大深度
  maxResults?: number;       // 最大结果数
}
```

## FindCondition

```typescript
type FindCondition<T> = 
  | ((info: NodeInfo<T>) => boolean)  // 函数条件
  | Partial<NodeInfo<T>>               // 对象条件
  | string                              // 字符串匹配
  | number                              // 数字匹配
  | RegExp;                             // 正则匹配
```
