# 性能优化

本指南帮助你充分利用 HJSON Topology Toolkit 的性能特性。

## 基准测试数据

在标准笔记本上测试（10万节点数据集）：

| 操作 | 时间 | 内存 |
|------|------|------|
| BFS 遍历 | ~50ms | ~5MB |
| DFS 遍历 | ~45ms | ~3MB |
| 查找单个节点 | ~5ms | <1MB |
| 查找所有匹配 | ~15ms | ~2MB |
| 深度克隆 | ~80ms | ~20MB |
| 扁平化 | ~60ms | ~15MB |
| 异步 BFS (并发=10) | ~120ms | ~8MB |

## 遍历优化

### 使用 maxDepth 限制深度

```typescript
import { traverse } from 'hjson-topology-toolkit';

// 好的做法 - 限制深度
traverse(data, callback, 'dfs', { maxDepth: 3 });

// 避免 - 遍历整个深层结构
traverse(data, callback); // 可能遍历数千层
```

### 及时中断遍历

```typescript
import { bfs } from 'hjson-topology-toolkit';

// 找到目标后立即停止
bfs(data, (info) => {
  if (info.key === 'target') {
    console.log('Found:', info.value);
    return false; // 中断遍历
  }
});
```

### 选择合适的遍历模式

```typescript
// BFS - 适合找最短路径
// 内存占用较高（需要存储队列）
bfs(data, callback);

// DFS - 适合深层遍历
// 内存占用较低（递归栈）
dfs(data, callback);

// 对于超大结构，DFS 通常更快
```

## 查找优化

### 使用精确条件

```typescript
import { find } from 'hjson-topology-toolkit';

// 好的做法 - 精确匹配
find(data, { key: 'userId', value: 123 });

// 避免 - 使用通配符或模糊匹配
find(data, (info) => String(info.key).includes('user'));
```

### 限制查找范围

```typescript
// 好的做法 - 限制深度和结果数
findAll(data, condition, {
  maxDepth: 3,
  maxResults: 10
});
```

## 转换优化

### 避免不必要的克隆

```typescript
import { map, clone } from 'hjson-topology-toolkit';

// 如果不需要保留原数据，避免显式克隆
const result = map(data, transformFn);
// map 内部已经创建了新的结构

// 只有在需要保留原数据时才克隆
const backup = clone(data);
const result = map(data, transformFn);
```

### 批量操作优于多次操作

```typescript
import { chain } from 'hjson-topology-toolkit';

// 不好的做法 - 多次遍历
const step1 = map(data, fn1);
const step2 = map(step1, fn2);
const step3 = map(step2, fn3);

// 好的做法 - 一次遍历完成所有操作
const result = map(data, (info) => {
  let value = fn1(info.value);
  value = fn2(value);
  value = fn3(value);
  return value;
});
```

## 异步优化

### 合理设置并发数

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

// CPU 密集型 - 低并发
await asyncBFS(data, cpuIntensiveTask, { concurrency: 2 });

// I/O 密集型 - 高并发
await asyncBFS(data, ioTask, { concurrency: 20 });

// 网络请求 - 适中并发
await asyncBFS(data, apiCall, { concurrency: 5 });
```

### 使用超时防止阻塞

```typescript
import { asyncFind } from 'hjson-topology-toolkit/async';

try {
  const result = await asyncFind(data, asyncCondition, {
    timeout: 5000  // 5秒超时
  });
} catch (error) {
  console.log('Operation timed out');
}
```

### 及时取消不需要的操作

```typescript
const controller = new AbortController();

// 启动长时间操作
const promise = asyncBFS(data, callback, {
  abortSignal: controller.signal
});

// 用户取消时
button.addEventListener('click', () => {
  controller.abort();
});
```

## 内存优化

### 使用生成器处理大数据

```typescript
import { dfs } from 'hjson-topology-toolkit';

// 避免一次性加载所有结果
function* leafNodes(data: unknown) {
  dfs(data, (info) => {
    if (info.isLeaf) {
      yield info;
    }
  });
}

// 逐行处理
for (const node of leafNodes(bigData)) {
  await processNode(node);
}
```

### 流式处理

```typescript
import { chain } from 'hjson-topology-toolkit';

// 分批处理大数组
const batchSize = 1000;
const results = [];

for (let i = 0; i < data.items.length; i += batchSize) {
  const batch = data.items.slice(i, i + batchSize);
  const processed = chain({ items: batch })
    .map(transform)
    .value();
  results.push(...processed.items);
  
  // 允许 GC
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

## 缓存策略

### 缓存验证器

```typescript
import { createValidator } from 'hjson-topology-toolkit';

// 创建一次，多次使用
const validateUser = await createValidator(userSchema);

for (const user of users) {
  const result = validateUser(user); // 快速验证
}
```

### 缓存查找结果

```typescript
const cache = new Map();

function findCached(data: unknown, key: string) {
  const cacheKey = JSON.stringify(data) + key;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = find(data, { key });
  cache.set(cacheKey, result);
  return result;
}
```

## 针对特定场景的优化

### 配置文件处理

```typescript
import { parse, chain } from 'hjson-topology-toolkit';

// 只解析需要的部分
const config = parse(hjsonText);

// 使用链式 API 快速提取
const dbConfig = chain(config)
  .get('database')
  .value();
```

### 日志数据处理

```typescript
import { filter, map } from 'hjson-topology-toolkit';

// 先过滤，再转换（减少处理量）
const errors = filter(logs, (info) => {
  return info.key === 'level' && info.value === 'error';
});

const processed = map(errors, transformFn);
```

### API 响应处理

```typescript
import { chain } from 'hjson-topology-toolkit';

// 最小化转换
const result = chain(apiResponse)
  .pick(['data', 'meta'])  // 只取需要的字段
  .map((info) => {
    // 只处理特定字段
    if (info.key === 'timestamp') {
      return new Date(info.value).toISOString();
    }
    return info.value;
  })
  .value();
```

## 性能监控

### 添加性能测量

```typescript
import { traverse } from 'hjson-topology-toolkit';

function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  const memStart = process.memoryUsage().heapUsed;
  
  fn();
  
  const duration = performance.now() - start;
  const memUsed = (process.memoryUsage().heapUsed - memStart) / 1024 / 1024;
  
  console.log(`${name}: ${duration.toFixed(2)}ms, ${memUsed.toFixed(2)}MB`);
}

measurePerformance('Traverse', () => {
  traverse(data, callback);
});
```

### 使用 Traverser 获取统计

```typescript
import { Traverser } from 'hjson-topology-toolkit';

const traverser = new Traverser(data);
const stats = traverser.getStats();

console.log('Node count:', stats.nodeCount);
console.log('Max depth:', stats.maxDepth);
console.log('Avg branching:', stats.avgBranchingFactor);
```

## 最佳实践总结

1. **始终限制遍历深度** - 使用 `maxDepth` 防止深层遍历
2. **及时中断** - 找到目标后立即返回 `false`
3. **批量操作** - 一次遍历完成多个操作
4. **合理并发** - 根据操作类型设置并发数
5. **使用超时** - 防止长时间运行的操作
6. **缓存结果** - 复用验证器等资源
7. **流式处理** - 大数据集分批处理
8. **先过滤后处理** - 减少不必要的工作量
