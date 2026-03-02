# API 概览

HJSON Topology Toolkit 提供丰富的 API，分为以下几个类别：

## 核心模块

| 模块 | 描述 | 导入路径 |
|------|------|----------|
| 遍历 | BFS/DFS 遍历 | `hjson-topology-toolkit` |
| 查找 | 深度查找功能 | `hjson-topology-toolkit` |
| 转换 | 映射、过滤、归约等 | `hjson-topology-toolkit` |
| 验证 | JSON Schema 验证 | `hjson-topology-toolkit` |
| HJSON | HJSON 解析/序列化 | `hjson-topology-toolkit` |
| 链式 | 链式 API | `hjson-topology-toolkit` |
| 异步 | 异步操作 | `hjson-topology-toolkit/async` |

## 类型定义

```typescript
import type { 
  NodeInfo, 
  TraverseMode, 
  FindCondition,
  ValidationResult 
} from 'hjson-topology-toolkit';
```

## 常用 API 速查

### 遍历

```typescript
import { bfs, dfs, traverse } from 'hjson-topology-toolkit';

// BFS 遍历
bfs(data, callback, options);

// DFS 遍历
dfs(data, callback, { order: 'pre' | 'post' });

// 通用遍历
traverse(data, callback, mode, options);
```

### 查找

```typescript
import { find, findAll, get, query } from 'hjson-topology-toolkit';

// 查找单个节点
find(data, condition, options);

// 查找所有匹配节点
findAll(data, condition, options);

// 通过路径获取值
get(data, 'path.to.value');

// XPath 风格查询
query(data, 'users/*/name');
```

### 转换

```typescript
import { map, filter, reduce, flatten, clone } from 'hjson-topology-toolkit';

// 深度映射
map(data, callback);

// 深度过滤
filter(data, callback);

// 深度归约
reduce(data, callback, initialValue);

// 扁平化
flatten(data, options);

// 深度克隆
clone(data);
```

### 链式 API

```typescript
import { chain } from 'hjson-topology-toolkit';

chain(data)
  .map(callback)
  .filter(callback)
  .replace(condition, replacement)
  .value();
```

### HJSON

```typescript
import { parse, stringify, format } from 'hjson-topology-toolkit';

// 解析 HJSON
parse(text, options);

// 序列化为 HJSON
stringify(data, options);

// 格式化
format(text, options);
```

### 异步

```typescript
import { asyncChain, asyncFind, asyncMap } from 'hjson-topology-toolkit/async';

// 异步链式 API
await asyncChain(data)
  .map(asyncCallback)
  .filter(asyncCallback)
  .toPromise();

// 异步查找
await asyncFind(data, asyncCondition);

// 异步映射
await asyncMap(data, asyncCallback);
```

## 类 API

### Traverser

```typescript
import { Traverser } from 'hjson-topology-toolkit';

const traverser = new Traverser(data);
traverser
  .bfs(callback)
  .dfs(callback)
  .getDepth()
  .getStats();
```

### Finder

```typescript
import { Finder } from 'hjson-topology-toolkit';

const finder = new Finder(data);
finder
  .find(condition)
  .findAll(condition)
  .get('path.to.value');
```

### Transform

```typescript
import { Transform } from 'hjson-topology-toolkit';

const transform = new Transform(data);
transform
  .map(callback)
  .filter(callback)
  .flatten()
  .value();
```

### Validator

```typescript
import { Validator } from 'hjson-topology-toolkit';

const validator = new Validator();
validator
  .register('schemaName', schema)
  .validate('schemaName', data);
```

### HJSON

```typescript
import { HJSON } from 'hjson-topology-toolkit';

const hjson = new HJSON(data);
hjson
  .setPath('path.to.value', newValue)
  .getPath('path.to.value')
  .toJSON();
```

## 详细文档

- [遍历 API](./traverser)
- [查找 API](./finder)
- [转换 API](./transformer)
- [验证 API](./validator)
- [HJSON API](./hjson)
- [异步 API](./async)
