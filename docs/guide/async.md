# 异步操作

异步模块提供完整的异步操作支持，包括并发控制、超时和取消信号。

## 导入异步功能

```typescript
import { 
  asyncChain, 
  asyncFind, 
  asyncMap 
} from 'hjson-topology-toolkit/async';
```

## 异步遍历

### 异步 BFS

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

await asyncBFS(data, async (info) => {
  // 异步操作
  await someAsyncOperation(info.value);
}, {
  concurrency: 5,      // 限制并发数
  maxDepth: 3,         // 限制深度
  abortSignal: signal  // 取消信号
});
```

### 异步 DFS

```typescript
import { asyncDFS } from 'hjson-topology-toolkit/async';

await asyncDFS(data, async (info) => {
  await processNode(info);
}, {
  order: 'pre',        // 'pre' 或 'post'
  abortSignal: signal
});
```

### 通用异步遍历

```typescript
import { asyncTraverse } from 'hjson-topology-toolkit/async';

await asyncTraverse(
  data,
  async (info) => {
    await processNode(info);
  },
  'bfs',  // 或 'dfs'
  { maxDepth: 3 }
);
```

## 异步查找

### asyncFind

```typescript
import { asyncFind } from 'hjson-topology-toolkit/async';

// 异步查找单个节点
const result = await asyncFind(data, async (info) => {
  // 查询数据库
  const exists = await checkDatabase(info.value);
  return exists;
}, {
  mode: 'bfs',
  timeout: 5000,      // 5秒超时
  abortSignal: signal
});

console.log(result?.value);
```

### asyncFindAll

```typescript
import { asyncFindAll } from 'hjson-topology-toolkit/async';

// 异步查找所有匹配节点
const results = await asyncFindAll(data, async (info) => {
  const isValid = await validateAsync(info.value);
  return isValid;
}, {
  maxResults: 10,     // 最多返回10个结果
  concurrency: 5      // 最多5个并发验证
});
```

## 异步转换

### asyncMap

```typescript
import { asyncMap } from 'hjson-topology-toolkit/async';

// 异步映射转换
const enriched = await asyncMap(data, async (info) => {
  if (info.key === 'userId') {
    // 异步获取用户详情
    return await fetchUserDetails(info.value);
  }
  return info.value;
}, {
  concurrency: 3  // 限制并发请求数
});
```

### asyncFilter

```typescript
import { asyncFilter } from 'hjson-topology-toolkit/async';

// 异步过滤
const validItems = await asyncFilter(data, async (info) => {
  // 异步验证
  return await isValidAsync(info.value);
});
```

### asyncReduce

```typescript
import { asyncReduce } from 'hjson-topology-toolkit/async';

// 异步归约
const total = await asyncReduce(
  data,
  async (acc, info) => {
    const value = await calculateAsync(info.value);
    return acc + value;
  },
  0
);
```

## 异步替换

```typescript
import { asyncReplace, asyncReplaceAll } from 'hjson-topology-toolkit/async';

// 异步替换单个节点
const result = await asyncReplace(data, async (info) => {
  return await shouldReplaceAsync(info);
}, async (info) => {
  return await getReplacementAsync(info);
});

// 异步替换所有匹配节点
const result = await asyncReplaceAll(data, condition, replacement);
```

## 异步链式 API

```typescript
import { asyncChain } from 'hjson-topology-toolkit/async';

// 注意：每个异步操作都需要 await
const chain = asyncChain(data);

const mapped = await chain.map(async (info) => {
  await new Promise(resolve => setTimeout(resolve, 10));
  return typeof info.value === 'string' 
    ? info.value.toUpperCase() 
    : info.value;
});

const filtered = await mapped.filter(async (info) => {
  return info.key !== 'password';
});

const result = await filtered.toPromise();
```

## 取消操作

使用 `AbortController` 取消异步操作：

```typescript
const controller = new AbortController();
const signal = controller.signal;

// 启动异步操作
const promise = asyncBFS(data, async (info) => {
  await processNode(info);
}, { signal });

// 5秒后取消
setTimeout(() => controller.abort(), 5000);

try {
  await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation was aborted');
  }
}
```

## 并发控制

### 限制并发数

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

await asyncBFS(data, async (info) => {
  // 模拟异步请求
  await fetch(`/api/process/${info.value}`);
}, {
  concurrency: 5  // 最多5个并发请求
});
```

### 超时控制

```typescript
import { asyncFind } from 'hjson-topology-toolkit/async';

try {
  const result = await asyncFind(data, async (info) => {
    await slowDatabaseQuery(info.value);
    return info.value === 'target';
  }, {
    timeout: 10000  // 10秒超时
  });
} catch (error) {
  if (error.message === 'Search timeout') {
    console.log('Search took too long');
  }
}
```

## 实际应用场景

### 批量数据验证

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

async function validateAllData(data: unknown) {
  const errors: string[] = [];
  
  await asyncBFS(data, async (info) => {
    if (info.key === 'email') {
      const isValid = await validateEmail(String(info.value));
      if (!isValid) {
        errors.push(`Invalid email at ${info.path.join('.')}`);
      }
    }
  }, {
    concurrency: 10  // 最多10个并发验证
  });
  
  return errors;
}
```

### 数据增强

```typescript
import { asyncMap } from 'hjson-topology-toolkit/async';

async function enrichUserData(users: unknown) {
  return asyncMap(users, async (info) => {
    if (info.key === 'userId') {
      const [profile, permissions] = await Promise.all([
        fetchUserProfile(info.value),
        fetchUserPermissions(info.value)
      ]);
      return { ...profile, permissions };
    }
    return info.value;
  }, {
    concurrency: 5  // 限制 API 请求速率
  });
}
```

### 并发文件处理

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

async function processFiles(config: unknown) {
  await asyncBFS(config, async (info) => {
    if (info.key === 'filePath') {
      const content = await readFile(String(info.value));
      const processed = await processContent(content);
      await writeFile(String(info.value), processed);
    }
  }, {
    concurrency: 3  // 最多同时处理3个文件
  });
}
```

### 带进度监控的批量操作

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

async function processWithProgress(data: unknown) {
  let processed = 0;
  const total = countNodes(data);
  
  await asyncBFS(data, async (info) => {
    await processNode(info);
    processed++;
    
    // 更新进度
    const progress = (processed / total * 100).toFixed(1);
    console.log(`Progress: ${progress}%`);
  }, {
    concurrency: 5
  });
}
```

## 性能提示

- 使用 `concurrency` 限制并发数，避免资源耗尽
- 对于 CPU 密集型操作，考虑使用 Worker Threads
- 使用 `abortSignal` 及时取消不需要的操作
- 合理设置 `timeout` 避免长时间等待
- 优先使用 `asyncMap` 而不是 `asyncBFS` 进行数据转换
