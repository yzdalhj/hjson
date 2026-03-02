# 异步 API

::: tip
异步 API 需要从 `hjson-topology-toolkit/async` 子路径导入。
:::

## 异步遍历

```typescript
import { 
  asyncTraverse, 
  asyncBFS, 
  asyncDFS 
} from 'hjson-topology-toolkit/async';

// 异步 BFS
await asyncBFS(data, async (info) => {
  await processAsync(info);
}, { concurrency: 5 });

// 异步 DFS
await asyncDFS(data, async (info) => {
  await processAsync(info);
}, { order: 'pre' });

// 通用异步遍历
await asyncTraverse(data, callback, 'bfs', options);
```

### 选项

```typescript
interface AsyncTraverseOptions {
  maxDepth?: number;
  concurrency?: number;   // 并发数限制
  abortSignal?: AbortSignal;
}
```

## 异步查找

```typescript
import { asyncFind, asyncFindAll } from 'hjson-topology-toolkit/async';

// 异步查找单个节点
const result = await asyncFind(data, async (info) => {
  return await checkAsync(info.value);
}, { timeout: 5000 });

// 异步查找所有匹配节点
const results = await asyncFindAll(data, async (info) => {
  return await validateAsync(info.value);
}, { maxResults: 10 });
```

### AsyncFindOptions

```typescript
interface AsyncFindOptions extends FindOptions {
  concurrency?: number;
  timeout?: number;       // 超时时间（毫秒）
  abortSignal?: AbortSignal;
}
```

## 异步转换

```typescript
import { 
  asyncMap, 
  asyncFilter, 
  asyncReduce,
  asyncReplace,
  asyncReplaceAll
} from 'hjson-topology-toolkit/async';

// 异步映射
const result = await asyncMap(data, async (info) => {
  return await transformAsync(info.value);
});

// 异步过滤
const filtered = await asyncFilter(data, async (info) => {
  return await isValidAsync(info.value);
});

// 异步归约
const sum = await asyncReduce(data, async (acc, info) => {
  return acc + await calculateAsync(info.value);
}, 0);

// 异步替换
const result = await asyncReplace(data, condition, async (info) => {
  return await getReplacementAsync(info);
});
```

## AsyncChain

```typescript
import { asyncChain } from 'hjson-topology-toolkit/async';

const chain = asyncChain(data);

const mapped = await chain.map(async (info) => {
  return await transformAsync(info.value);
});

const filtered = await mapped.filter(async (info) => {
  return await checkAsync(info.value);
});

const result = await filtered.toPromise();
```

### 方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `forEach(callback, options?)` | `Promise<this>` | 异步遍历 |
| `forEachBFS(callback, options?)` | `Promise<this>` | 异步 BFS 遍历 |
| `forEachDFS(callback, options?)` | `Promise<this>` | 异步 DFS 遍历 |
| `map(callback, options?)` | `Promise<AsyncChain<R>>` | 异步映射 |
| `filter(callback, options?)` | `Promise<this>` | 异步过滤 |
| `reduce(callback, initial, options?)` | `Promise<R>` | 异步归约 |
| `find(condition, options?)` | `Promise<AsyncNodeInfo<T> \| undefined>` | 异步查找 |
| `findAll(condition, options?)` | `Promise<AsyncNodeInfo<T>[]>` | 异步查找所有 |
| `replace(condition, replacement, options?)` | `Promise<this>` | 异步替换 |
| `replaceAll(condition, replacement, options?)` | `Promise<this>` | 异步替换所有 |
| `value()` | `T` | 获取值 |
| `toPromise()` | `Promise<T>` | 转为 Promise |
| `clone()` | `AsyncChain<T>` | 克隆 |
| `pipe(fn)` | `Promise<AsyncChain<R>>` | 管道操作 |

## AsyncNodeInfo

```typescript
interface AsyncNodeInfo<T = NodeValue> extends NodeInfo<T> {
  abortSignal?: AbortSignal;
}
```

## 取消操作

```typescript
const controller = new AbortController();
const signal = controller.signal;

// 启动操作
const promise = asyncBFS(data, async (info) => {
  await processNode(info);
}, { signal });

// 取消
controller.abort();
```
