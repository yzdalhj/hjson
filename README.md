# HJSON Topology Toolkit

强大的 HJSON/JSON 拓扑结构处理工具包，支持遍历、查找、转换、验证等功能。

## 特性

- 🌲 **拓扑遍历** - 支持 BFS（广度优先）和 DFS（深度优先）遍历
- 🔍 **深度查找** - 支持条件查找、路径查找、XPath 风格查询
- 🔄 **数据转换** - 映射、过滤、归约、扁平化、克隆、合并
- ✅ **Schema 验证** - 基于 AJV 的 JSON Schema 验证
- ⛓️ **链式 API** - 流畅的接口设计，支持方法链式调用
- ⚡ **异步支持** - 完整的异步操作支持，包括并发控制
- 📦 **HJSON 支持** - 完整的 HJSON 解析和序列化功能
- 📝 **TypeScript** - 完整的类型定义支持

## 安装

```bash
npm install hjson-topology-toolkit
```

## 快速开始

```typescript
import { chain, find, traverse, validate } from 'hjson-topology-toolkit';

// 示例数据
const data = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  settings: {
    theme: 'dark',
    notifications: true
  }
};

// 使用链式 API
const result = chain(data)
  .find({ key: 'name', value: 'Alice' })
  .replace({ key: 'email' }, { value: '***@example.com' })
  .value();

// 深度查找
const user = find(data, { key: 'name', value: 'Bob' });

// 遍历所有节点
traverse(data, (info) => {
  console.log(`Path: ${info.path.join('.')}, Value:`, info.value);
});
```

## 核心功能

### 1. 遍历 (Traverser)

支持 BFS 和 DFS 两种遍历模式：

```typescript
import { bfs, dfs, traverse, Traverser } from 'hjson-topology-toolkit';

// BFS 遍历
bfs(data, (info) => {
  console.log(info.key, info.value, info.depth);
});

// DFS 前序遍历
dfs(data, (info) => {
  console.log(info.key, info.value);
}, { order: 'pre' });

// DFS 后序遍历
dfs(data, (info) => {
  console.log(info.key, info.value);
}, { order: 'post' });

// 通用遍历
traverse(data, callback, 'bfs', { maxDepth: 3 });

// 使用 Traverser 类
const traverser = new Traverser(data);
const depth = traverser.getDepth();
const stats = traverser.getStats();
```

### 2. 查找 (Finder)

强大的深度查找功能：

```typescript
import { find, findAll, get, query, Finder } from 'hjson-topology-toolkit';

// 查找单个节点
const result = find(data, { key: 'name' });

// 使用函数条件
const result = find(data, (info) => info.depth > 2 && info.value === 'target');

// 查找所有匹配节点
const results = findAll(data, { value: 'active' }, { maxResults: 10 });

// 通过路径获取值
const value = get(data, 'users.0.name');
const value = get(data, ['users', 0, 'name']);

// XPath 风格查询
const results = query(data, 'users/*/name');

// 查找父节点
const parent = findParent(data, { key: 'email' });

// 查找兄弟节点
const siblings = findSiblings(data, { key: 'id', value: 1 });
```

### 3. 转换 (Transformer)

丰富的数据转换功能：

```typescript
import { 
  map, filter, reduce, 
  replace, flatten, unflatten,
  clone, deepMerge, pick, omit 
} from 'hjson-topology-toolkit';

// 深度映射
const mapped = map(data, (info) => {
  return typeof info.value === 'string' 
    ? info.value.toUpperCase() 
    : info.value;
});

// 深度过滤
const filtered = filter(data, (info) => {
  return info.key !== 'password';
});

// 深度归约
const sum = reduce(data, (acc, info) => {
  return typeof info.value === 'number' ? acc + info.value : acc;
}, 0);

// 替换节点
const replaced = replace(data, 'password', '***');
const replaced = replaceAll(data, /secret/i, '[REDACTED]');

// 扁平化
const flat = flatten(data, { delimiter: '.' });
// { 'users.0.name': 'Alice', 'users.0.email': 'alice@example.com' }

// 反扁平化
const nested = unflatten(flat);

// 深度克隆
const cloned = clone(data);

// 深度合并
const merged = deepMerge(data1, data2, data3);

// 选取字段
const picked = pick(data, ['users', 'settings.theme']);

// 排除字段
const omitted = omit(data, ['password', 'secretKey']);
```

### 4. 验证 (Validator)

基于 AJV 的 Schema 验证：

```typescript
import { validate, validateSync, Validator } from 'hjson-topology-toolkit';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name']
};

// 异步验证
const result = await validate(data, schema);
if (!result.valid) {
  console.log(result.errors);
}

// 同步验证
const result = validateSync(data, schema);

// 使用 Validator 类
const validator = new Validator();
validator.register('user', schema);
const result = validator.validateSync('user', data);
```

### 5. HJSON 支持

完整的 HJSON 处理功能：

```typescript
import { 
  parse, stringify, format, minify,
  convertJSONtoHJSON, convertHJSONtoJSON,
  load, save, HJSON 
} from 'hjson-topology-toolkit';

// 解析 HJSON
const data = parse(`
{
  # 这是注释
  name: Alice
  age: 30
}
`);

// 序列化为 HJSON
const hjson = stringify(data, { bracesSameLine: true });

// 格式化
const formatted = await format(rawHJSON);

// 压缩
const compressed = await minify(rawHJSON);

// 文件操作
const data = await load('config.hjson');
await save('output.hjson', data);

// 使用 HJSON 类
const hjson = new HJSON(data);
hjson.setPath('users.0.name', 'Bob');
await hjson.save('config.hjson');
```

### 6. 链式 API

流畅的链式操作：

```typescript
import { chain, hjson } from 'hjson-topology-toolkit';

const result = chain(data)
  // 过滤
  .filter(info => info.key !== 'password')
  // 映射
  .map(info => typeof info.value === 'string' ? info.value.trim() : info.value)
  // 替换
  .replace('email', '***@example.com')
  // 验证
  .validateSync(schema)
  // 扁平化查看
  .flatten()
  .value();

// 条件操作
const result = chain(data)
  .when(data.users.length > 0, ch => ch.filter(info => info.key === 'active'))
  .when(process.env.NODE_ENV === 'production', ch => ch.replace('debug', false))
  .value();

// 分支操作
const result = chain(data)
  .if(data.version === 1)
    .then(ch => ch.set('legacy', true))
    .else(ch => ch.set('legacy', false))
  .value();
```

### 7. 异步操作

完整的异步支持：

```typescript
import { 
  asyncTraverse, asyncFind, asyncMap,
  asyncFilter, asyncChain 
} from 'hjson-topology-toolkit/async';

// 异步遍历
await asyncTraverse(data, async (info) => {
  await someAsyncOperation(info.value);
}, 'bfs', { concurrency: 5 });

// 异步查找
const result = await asyncFind(data, async (info) => {
  return await checkDatabase(info.value.id);
});

// 异步映射
const mapped = await asyncMap(data, async (info) => {
  return await transformValue(info.value);
});

// 异步过滤
const filtered = await asyncFilter(data, async (info) => {
  return await shouldKeep(info.value);
});

// 异步链式 API
const result = await asyncChain(data)
  .map(async (info) => await fetchData(info.value))
  .filter(async (info) => await isValid(info.value))
  .reduce(async (acc, info) => acc + await calculate(info.value), 0);
```

## API 文档

### 类型定义

```typescript
interface NodeInfo<T> {
  value: T;                    // 节点值
  key: string | number;        // 节点键
  path: (string | number)[];   // 节点路径
  depth: number;               // 节点深度
  parent?: unknown;            // 父节点
  parentKey?: string | number; // 父节点键
  isRoot: boolean;             // 是否为根节点
  isLeaf: boolean;             // 是否为叶子节点
}

type TraverseMode = 'bfs' | 'dfs';
type TraverseOrder = 'pre' | 'post';

type FindCondition<T> = 
  | ((info: NodeInfo<T>) => boolean)
  | Partial<NodeInfo<T>>
  | string
  | number
  | RegExp;
```

## 性能

```bash
npm run benchmark
```

## 许可证

MIT
