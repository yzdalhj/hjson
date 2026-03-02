# 遍历 API

## bfs

广度优先遍历。

```typescript
function bfs<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  options?: { maxDepth?: number }
): void
```

### 示例

```typescript
import { bfs } from 'hjson-topology-toolkit';

bfs(data, (info) => {
  console.log(`${info.path.join('.')}: ${info.value}`);
}, { maxDepth: 3 });
```

## dfs

深度优先遍历。

```typescript
function dfs<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  options?: { order?: 'pre' | 'post'; maxDepth?: number }
): void
```

### 示例

```typescript
import { dfs } from 'hjson-topology-toolkit';

// 前序遍历
dfs(data, callback, { order: 'pre' });

// 后序遍历
dfs(data, callback, { order: 'post' });
```

## traverse

通用遍历函数。

```typescript
function traverse<T = NodeValue>(
  root: T,
  callback: TraverseCallback<T>,
  mode: 'bfs' | 'dfs' = 'dfs',
  options?: { order?: 'pre' | 'post'; maxDepth?: number }
): void
```

## Traverser 类

```typescript
import { Traverser } from 'hjson-topology-toolkit';

const traverser = new Traverser(data);

traverser
  .bfs(callback)
  .dfs(callback, { order: 'pre' })
  .getDepth()
  .getStats()
  .getLevels();
```

### 方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `bfs(callback, options?)` | `this` | BFS 遍历 |
| `dfs(callback, options?)` | `this` | DFS 遍历 |
| `getDepth()` | `number` | 获取最大深度 |
| `getLeafCount()` | `number` | 获取叶子节点数 |
| `getStats()` | `TraverserStats` | 获取统计信息 |
| `getLevels()` | `Map<number, NodeInfo[]>` | 获取层级结构 |
| `getRoot()` | `T` | 获取根节点 |

### TraverserStats

```typescript
interface TraverserStats {
  nodeCount: number;
  leafCount: number;
  maxDepth: number;
  avgBranchingFactor: number;
}
```
