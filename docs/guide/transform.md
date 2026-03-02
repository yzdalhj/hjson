# 转换

转换功能允许你对数据进行深度映射、过滤、归约和其他操作。

## 映射 (map)

深度遍历并转换每个节点。

```typescript
import { map } from 'hjson-topology-toolkit';

const data = {
  user: {
    name: 'alice',
    email: 'ALICE@EXAMPLE.COM'
  }
};

// 将所有字符串转为小写
const result = map(data, (info) => {
  if (typeof info.value === 'string') {
    return info.value.toLowerCase();
  }
  return info.value;
});

console.log(result.user.email); // 'alice@example.com'
```

### 条件映射

```typescript
// 只转换特定类型的节点
const result = map(data, (info) => {
  if (info.key === 'password') {
    return '***'; // 隐藏密码
  }
  return info.value;
});

// 基于路径的映射
const result = map(data, (info) => {
  if (info.path[0] === 'user') {
    // 只转换 user 下的节点
    return transformUserData(info.value);
  }
  return info.value;
});
```

## 过滤 (filter)

保留满足条件的节点。

```typescript
import { filter } from 'hjson-topology-toolkit';

// 移除所有 null/undefined 值
const cleaned = filter(data, (info) => {
  return info.value !== null && info.value !== undefined;
});

// 移除敏感字段
const sanitized = filter(data, (info) => {
  return !['password', 'secret', 'token'].includes(String(info.key));
});

// 只保留特定深度的节点
const shallow = filter(data, (info) => {
  return info.depth <= 2;
});
```

## 归约 (reduce)

遍历并累积结果。

```typescript
import { reduce } from 'hjson-topology-toolkit';

// 计算所有数字之和
const sum = reduce(data, (acc, info) => {
  return typeof info.value === 'number' ? acc + info.value : acc;
}, 0);

// 收集所有字符串值
const strings = reduce(data, (acc, info) => {
  if (typeof info.value === 'string') {
    acc.push(info.value);
  }
  return acc;
}, [] as string[]);

// 统计节点类型
const typeCount = reduce(data, (acc, info) => {
  const type = typeof info.value;
  acc[type] = (acc[type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

## 替换 (replace / replaceAll)

替换匹配的节点。

```typescript
import { replace, replaceAll } from 'hjson-topology-toolkit';

// 替换单个节点（找到第一个匹配后停止）
const result = replace(
  data,
  { key: 'status', value: 'inactive' },
  { value: 'active' }
);

// 替换所有匹配节点
const result = replaceAll(
  data,
  'localhost',
  'production-server.com'
);

// 使用函数替换
const result = replaceAll(
  data,
  /password/i,
  (info) => '***' + String(info.value).slice(-3)
);
```

## 扁平化 (flatten / unflatten)

将嵌套对象转为单层结构或恢复。

```typescript
import { flatten, unflatten } from 'hjson-topology-toolkit';

const data = {
  user: {
    name: 'Alice',
    address: {
      city: 'NYC',
      zip: '10001'
    }
  }
};

// 扁平化
const flat = flatten(data);
console.log(flat);
// {
//   'user.name': 'Alice',
//   'user.address.city': 'NYC',
//   'user.address.zip': '10001'
// }

// 自定义分隔符
const flat = flatten(data, { delimiter: '/' });
// {
//   'user/name': 'Alice',
//   'user/address/city': 'NYC'
// }

// 限制深度
const flat = flatten(data, { maxDepth: 1 });
// {
//   'user': { name: 'Alice', address: { ... } }
// }

// 排除数组
const flat = flatten(data, { includeArrays: false });

// 反扁平化
const nested = unflatten(flat);
```

## 克隆与合并

### 深度克隆

```typescript
import { clone } from 'hjson-topology-toolkit';

const copy = clone(data);
copy.user.name = 'Bob';
console.log(data.user.name); // 仍然是 'Alice'
```

### 深度合并

```typescript
import { deepMerge } from 'hjson-topology-toolkit';

const defaults = {
  theme: 'light',
  port: 3000,
  database: { host: 'localhost', port: 5432 }
};

const userConfig = {
  theme: 'dark',
  database: { port: 3306 }
};

const config = deepMerge(defaults, userConfig);
console.log(config);
// {
//   theme: 'dark',
//   port: 3000,
//   database: { host: 'localhost', port: 3306 }
// }
```

## 选取与排除

### pick - 选取指定路径

```typescript
import { pick } from 'hjson-topology-toolkit';

const data = {
  user: {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'secret',
    age: 30
  }
};

const publicInfo = pick(data, ['user.name', 'user.email']);
console.log(publicInfo);
// { user: { name: 'Alice', email: 'alice@example.com' } }
```

### omit - 排除指定路径

```typescript
import { omit } from 'hjson-topology-toolkit';

const safeData = omit(data, ['user.password', 'user.secretKey']);
console.log(safeData);
// { user: { name: 'Alice', email: 'alice@example.com', age: 30 } }
```

## 使用 Transform 类

```typescript
import { Transform } from 'hjson-topology-toolkit';

const result = new Transform(data)
  .map((info) => typeof info.value === 'string' 
    ? info.value.toLowerCase() 
    : info.value)
  .filter((info) => info.key !== 'password')
  .replace('localhost', '127.0.0.1')
  .flatten({ delimiter: '.' })
  .value();
```

## 实际应用场景

### 数据清洗管道

```typescript
import { map, filter, clone } from 'hjson-topology-toolkit';

function cleanData(data: unknown) {
  return clone(data)
    // 1. 修剪字符串
    |> map($, (info) => typeof info.value === 'string' 
      ? info.value.trim() 
      : info.value)
    // 2. 移除空值
    |> filter($, (info) => {
        return info.value !== '' 
          && info.value !== null 
          && info.value !== undefined;
      })
    // 3. 标准化日期格式
    |> map($, (info) => {
        if (info.key === 'date' && typeof info.value === 'string') {
          return new Date(info.value).toISOString();
        }
        return info.value;
      });
}
```

### 配置继承

```typescript
import { deepMerge } from 'hjson-topology-toolkit';

const baseConfig = loadConfig('base.json');
const envConfig = loadConfig(`${process.env.NODE_ENV}.json`);
const localConfig = loadConfig('local.json');

const finalConfig = deepMerge(baseConfig, envConfig, localConfig);
```

### 表单数据准备

```typescript
import { flatten, pick } from 'hjson-topology-toolkit';

// 将嵌套对象转为表单字段
const formData = flatten(userProfile, { delimiter: '_' });
// { user_name: 'Alice', user_address_city: 'NYC', ... }

// 只提取需要更新的字段
const updates = pick(changes, ['user.name', 'user.email']);
```
