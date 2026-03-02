# 遍历

遍历是 HJSON Topology Toolkit 的核心功能之一。本库提供 BFS（广度优先）和 DFS（深度优先）两种遍历模式。

## BFS (广度优先遍历)

BFS 按层级遍历，先访问所有兄弟节点，再进入子节点。

```typescript
import { bfs } from 'hjson-topology-toolkit';

const data = {
  company: 'Acme Inc',
  departments: {
    engineering: { head: 'Alice', count: 10 },
    sales: { head: 'Bob', count: 5 }
  }
};

bfs(data, (info) => {
  console.log(`${'  '.repeat(info.depth)}${info.key}: ${info.value}`);
});
```

输出：
```
: [object Object]           // 根节点 (depth=0)
  company: Acme Inc         // depth=1
  departments: [object Object]  // depth=1
    engineering: [object Object]  // depth=2
    sales: [object Object]        // depth=2
      head: Alice              // depth=3
      count: 10               // depth=3
      head: Bob                // depth=3
      count: 5                 // depth=3
```

### BFS 选项

```typescript
bfs(data, callback, {
  maxDepth: 2  // 限制最大深度
});
```

## DFS (深度优先遍历)

DFS 递归深入，支持前序和后序两种遍历顺序。

### 前序遍历 (Pre-order)

先访问节点本身，再访问子节点。

```typescript
import { dfs } from 'hjson-topology-toolkit';

dfs(data, (info) => {
  console.log(`${'  '.repeat(info.depth)}${info.key}: ${info.value}`);
}, { order: 'pre' });
```

输出：
```
: [object Object]
  company: Acme Inc
  departments: [object Object]
    engineering: [object Object]
      head: Alice
      count: 10
    sales: [object Object]
      head: Bob
      count: 5
```

### 后序遍历 (Post-order)

先访问子节点，再访问节点本身。

```typescript
dfs(data, (info) => {
  console.log(`${'  '.repeat(info.depth)}${info.key}: ${info.value}`);
}, { order: 'post' });
```

输出：
```
  company: Acme Inc
      head: Alice
      count: 10
    engineering: [object Object]
      head: Bob
      count: 5
    sales: [object Object]
  departments: [object Object]
: [object Object]
```

## 通用遍历函数

```typescript
import { traverse } from 'hjson-topology-toolkit';

// BFS 模式
traverse(data, callback, 'bfs', { maxDepth: 3 });

// DFS 前序模式
traverse(data, callback, 'dfs', { order: 'pre', maxDepth: 3 });

// DFS 后序模式
traverse(data, callback, 'dfs', { order: 'post' });
```

## 中断遍历

回调函数返回 `false` 可以中断遍历：

```typescript
import { bfs } from 'hjson-topology-toolkit';

// 找到第一个匹配项后停止
bfs(data, (info) => {
  if (info.key === 'targetKey') {
    console.log('Found:', info.value);
    return false; // 中断遍历
  }
});
```

## 遍历信息 (NodeInfo)

回调函数接收 `NodeInfo` 对象，包含丰富的节点信息：

```typescript
interface NodeInfo<T> {
  value: T;                    // 当前节点的值
  key: string | number;        // 当前节点的键
  path: (string | number)[];   // 从根节点到当前节点的完整路径
  depth: number;               // 当前节点的深度（根节点为 0）
  parent?: unknown;            // 父节点的值
  parentKey?: string | number; // 父节点的键
  isRoot: boolean;             // 是否为根节点
  isLeaf: boolean;             // 是否为叶子节点（非对象/数组）
}
```

## 使用 Traverser 类

面向对象的遍历方式：

```typescript
import { Traverser } from 'hjson-topology-toolkit';

const traverser = new Traverser(data);

// 执行遍历
traverser
  .bfs((info) => console.log(info.path.join('.')))
  .dfs((info) => console.log(info.key));

// 获取统计信息
const stats = traverser.getStats();
console.log(stats);
// {
//   nodeCount: 10,
//   leafCount: 6,
//   maxDepth: 3,
//   avgBranchingFactor: 2.5
// }

// 获取深度
const depth = traverser.getDepth();
console.log(`Max depth: ${depth}`);

// 获取层级结构
const levels = traverser.getLevels();
levels.forEach((nodes, depth) => {
  console.log(`Depth ${depth}: ${nodes.length} nodes`);
});
```

## 实际应用场景

### 收集所有路径

```typescript
import { dfs } from 'hjson-topology-toolkit';

function collectPaths(data: unknown): string[] {
  const paths: string[] = [];
  
  dfs(data, (info) => {
    if (info.isLeaf) {
      paths.push(info.path.join('.'));
    }
  });
  
  return paths;
}

const paths = collectPaths(data);
// ['company', 'departments.engineering.head', ...]
```

### 统计节点类型

```typescript
import { bfs } from 'hjson-topology-toolkit';

function countTypes(data: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  
  bfs(data, (info) => {
    const type = Array.isArray(info.value) 
      ? 'array' 
      : typeof info.value;
    counts[type] = (counts[type] || 0) + 1;
  });
  
  return counts;
}

const counts = countTypes(data);
// { object: 3, string: 3, number: 2 }
```

### 查找循环引用

```typescript
import { dfs } from 'hjson-topology-toolkit';

function findCircularRefs(data: unknown): string[] {
  const refs = new Set<unknown>();
  const circular: string[] = [];
  
  dfs(data, (info) => {
    if (typeof info.value === 'object' && info.value !== null) {
      if (refs.has(info.value)) {
        circular.push(info.path.join('.'));
      } else {
        refs.add(info.value);
      }
    }
  });
  
  return circular;
}
```

## 性能提示

- 对于大型数据结构，使用 `maxDepth` 限制遍历深度
- 找到目标后及时返回 `false` 中断遍历
- BFS 适合找最短路径，DFS 适合找深层节点
- 对于需要访问所有节点的场景，DFS 通常比 BFS 稍快（内存占用更少）
