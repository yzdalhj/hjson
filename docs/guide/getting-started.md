# 快速开始

本指南将帮助你在几分钟内开始使用 HJSON Topology Toolkit。

## 安装

::: code-group

```bash [npm]
npm install hjson-topology-toolkit
```

```bash [yarn]
yarn add hjson-topology-toolkit
```

```bash [pnpm]
pnpm add hjson-topology-toolkit
```

:::

## 基本示例

### 1. 遍历数据

```typescript
import { traverse, bfs, dfs } from 'hjson-topology-toolkit';

const data = {
  company: 'Acme Inc',
  employees: [
    { name: 'Alice', department: 'Engineering' },
    { name: 'Bob', department: 'Sales' }
  ]
};

// 使用 BFS (广度优先)
bfs(data, (info) => {
  console.log(`${info.path.join('.')}: ${info.value}`);
});

// 使用 DFS (深度优先)
dfs(data, (info) => {
  console.log(`${'  '.repeat(info.depth)}${info.key}: ${info.value}`);
}, { order: 'pre' });

// 通用遍历
traverse(data, (info) => {
  if (info.isLeaf) {
    console.log(`Leaf: ${info.path.join('.')} = ${info.value}`);
  }
}, 'bfs', { maxDepth: 2 });
```

### 2. 查找数据

```typescript
import { find, findAll, get } from 'hjson-topology-toolkit';

// 查找单个节点
const result = find(data, { key: 'name' });
console.log(result?.value); // 'Alice'

// 查找所有匹配节点
const allNames = findAll(data, { key: 'name' });
console.log(allNames.map(n => n.value)); // ['Alice', 'Bob']

// 使用函数条件
const engineeringEmployee = find(data, (info) => {
  return info.key === 'department' && info.value === 'Engineering';
});

// 通过路径获取值
const aliceDept = get(data, 'employees.0.department');
// 或者使用数组路径
const bobDept = get(data, ['employees', 1, 'department']);
```

### 3. 转换数据

```typescript
import { map, filter, flatten, clone } from 'hjson-topology-toolkit';

// 映射转换
const upperCase = map(data, (info) => {
  return typeof info.value === 'string' 
    ? info.value.toUpperCase() 
    : info.value;
});

// 过滤数据
const noEmails = filter(data, (info) => {
  return info.key !== 'email'; // 移除 email 字段
});

// 扁平化
const flat = flatten(data);
// 结果: { 'company': 'Acme Inc', 'employees.0.name': 'Alice', ... }

// 深度克隆
const copy = clone(data);
copy.company = 'New Name';
console.log(data.company); // 仍然是 'Acme Inc'
```

### 4. 使用链式 API

```typescript
import { chain } from 'hjson-topology-toolkit';

const result = chain(data)
  // 过滤掉敏感信息
  .filter(info => info.key !== 'password')
  // 转换所有字符串
  .map(info => typeof info.value === 'string' 
    ? info.value.trim() 
    : info.value)
  // 替换特定值
  .replace({ key: 'status', value: 'inactive' }, { value: 'active' })
  // 获取结果
  .value();
```

### 5. HJSON 处理

```typescript
import { parse, stringify, format } from 'hjson-topology-toolkit';

// 解析 HJSON (支持注释、无引号键等)
const hjsonText = `
{
  # 这是注释
  name: "My App"
  version: "1.0.0"
  port: 3000
}
`;

const config = parse(hjsonText);

// 修改并序列化回 HJSON
config.port = 8080;
const output = stringify(config, { 
  bracesSameLine: true,
  space: 2 
});

console.log(output);
// {
//   # 这是注释
//   name: "My App"
//   version: "1.0.0"
//   port: 8080
// }
```

### 6. 异步操作

```typescript
import { asyncChain, asyncFind, asyncMap } from 'hjson-topology-toolkit/async';

// 异步查找
const result = await asyncFind(data, async (info) => {
  // 可以在这里进行异步数据库查询
  const exists = await checkDatabase(info.value);
  return exists;
});

// 异步映射
const enriched = await asyncMap(data, async (info) => {
  if (info.key === 'userId') {
    return await fetchUserDetails(info.value);
  }
  return info.value;
});

// 异步链式操作
const result = await asyncChain(data)
  .map(async (info) => await transformAsync(info.value))
  .filter(async (info) => await isValidAsync(info.value))
  .toPromise();
```

## 下一步

现在你已经了解了基本概念，可以深入探索：

- [遍历指南](./traverse) - 了解 BFS 和 DFS 的更多细节
- [查找指南](./find) - 掌握各种查找技巧
- [转换指南](./transform) - 学习数据转换的各种方法
- [链式 API 指南](./chain) - 探索流畅的链式操作
- [异步操作指南](./async) - 处理异步场景
