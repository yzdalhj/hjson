# 查找

查找功能允许你在复杂的数据结构中快速定位目标节点。

## 基础查找

### 查找单个节点

```typescript
import { find } from 'hjson-topology-toolkit';

const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]
};

// 按 key 查找
const result = find(data, { key: 'name' });
console.log(result?.value); // 'Alice'

// 按 value 查找
const result = find(data, { value: 'Bob' });
console.log(result?.value); // 'Bob'
```

### 查找所有匹配节点

```typescript
import { findAll } from 'hjson-topology-toolkit';

const allNames = findAll(data, { key: 'name' });
console.log(allNames.map(n => n.value)); // ['Alice', 'Bob']

// 限制结果数量
const firstTwo = findAll(data, { key: 'id' }, { maxResults: 2 });
```

## 查找条件

### 函数条件

最灵活的查找方式：

```typescript
// 查找特定深度的节点
const deepNode = find(data, (info) => info.depth > 3);

// 复杂条件
const target = find(data, (info) => {
  return info.key === 'status' 
    && info.value === 'active'
    && info.depth === 2;
});

// 使用正则匹配
const secretKey = find(data, (info) => {
  return /password|secret|token/i.test(String(info.key));
});
```

### 正则条件

```typescript
// 查找 key 匹配正则的节点
const result = find(data, /^user_/);

// 查找 value 包含特定字符串的节点
const result = find(data, (info) => {
  return /error|fail/i.test(String(info.value));
});
```

### 简单值匹配

```typescript
// 查找值为 'target' 的节点
const result = find(data, 'target');

// 查找 key 或值为 42 的节点
const result = find(data, 42);
```

## 路径查找

### 通过路径获取值

```typescript
import { get, findByPath } from 'hjson-topology-toolkit';

// 使用点号路径
const name = get(data, 'users.0.name');

// 使用数组路径
const name = get(data, ['users', 0, 'name']);

// 使用 findByPath
const value = findByPath(data, ['users', 0, 'name']);
```

### XPath 风格查询

```typescript
import { query } from 'hjson-topology-toolkit';

const data = {
  users: [
    { name: 'Alice', address: { city: 'NYC' } },
    { name: 'Bob', address: { city: 'LA' } }
  ]
};

// 查询所有用户的名字
const names = query(data, 'users/*/name');
console.log(names.map(n => n.value)); // ['Alice', 'Bob']

// 查询特定索引
const firstUser = query(data, 'users/[0]/name');

// 查询嵌套属性
const cities = query(data, 'users/*/address/city');
```

## 关系查找

### 查找父节点

```typescript
import { findParent } from 'hjson-topology-toolkit';

const data = {
  user: {
    profile: {
      name: 'Alice'
    }
  }
};

// 查找 name 节点的父节点
const parent = findParent(data, { value: 'Alice' });
console.log(parent?.key); // 'profile'
console.log(parent?.path); // ['user', 'profile']
```

### 查找兄弟节点

```typescript
import { findSiblings } from 'hjson-topology-toolkit';

const data = {
  user: {
    name: 'Alice',
    age: 30,
    email: 'alice@example.com'
  }
};

// 查找 name 的兄弟节点
const siblings = findSiblings(data, { key: 'name' });
console.log(siblings.map(s => s.key)); // ['age', 'email']
```

### 按深度查找

```typescript
import { findByDepth } from 'hjson-topology-toolkit';

// 查找深度为 2 的所有节点
const depth2Nodes = findByDepth(data, 2);
```

## 专用查找函数

```typescript
import { 
  findByKey, 
  findByValue, 
  findByDepth,
  has 
} from 'hjson-topology-toolkit';

// 按 key 查找
findByKey(data, 'name');

// 按 value 查找
findByValue(data, 'Alice');

// 按深度查找
findByDepth(data, 2);

// 检查是否存在（返回 boolean）
const exists = has(data, { key: 'password' });
```

## 查找选项

```typescript
find(data, condition, {
  mode: 'dfs',      // 'bfs' 或 'dfs'
  order: 'pre',     // 'pre' 或 'post'（仅 DFS）
  maxDepth: 3,      // 限制最大深度
  maxResults: 10    // 限制结果数量（仅 findAll）
});
```

## 使用 Finder 类

```typescript
import { Finder } from 'hjson-topology-toolkit';

const finder = new Finder(data);

// 链式查找操作
const result = finder
  .find({ key: 'user' })
  ?.value;

// 组合多个查找
const user = finder.findByKey('users');
const activeUsers = finder.findAll({ value: 'active' });

// 路径查询
const value = finder.get('users.0.name');
```

## 实际应用场景

### 查找敏感信息

```typescript
import { findAll, replaceAll } from 'hjson-topology-toolkit';

// 查找所有可能的敏感字段
const sensitiveKeys = ['password', 'secret', 'token', 'key', 'credential'];
const found = [];

for (const key of sensitiveKeys) {
  const matches = findAll(data, { key });
  found.push(...matches);
}

// 替换敏感信息
const sanitized = replaceAll(
  data,
  (info) => sensitiveKeys.includes(String(info.key)),
  '[REDACTED]'
);
```

### 验证必填字段

```typescript
import { find, has } from 'hjson-topology-toolkit';

function validateRequired(data: unknown, fields: string[]): string[] {
  const missing: string[] = [];
  
  for (const field of fields) {
    if (!has(data, { key: field })) {
      missing.push(field);
    }
  }
  
  return missing;
}

const required = ['id', 'name', 'email'];
const missing = validateRequired(data, required);
```

### 查找重复值

```typescript
import { findAll } from 'hjson-topology-toolkit';

function findDuplicates(data: unknown): Record<string, number> {
  const valueCount = new Map<unknown, number>();
  
  findAll(data, (info) => {
    if (info.isLeaf) {
      const count = valueCount.get(info.value) || 0;
      valueCount.set(info.value, count + 1);
    }
    return true;
  });
  
  const duplicates: Record<string, number> = {};
  valueCount.forEach((count, value) => {
    if (count > 1) {
      duplicates[String(value)] = count;
    }
  });
  
  return duplicates;
}
```
