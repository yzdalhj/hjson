# 示例

本页面展示 HJSON Topology Toolkit 的实际使用示例。

## 配置文件管理

### 读取和修改配置文件

```typescript
import { parse, stringify, load, save } from 'hjson-topology-toolkit';

// 读取带注释的配置
const config = await load('config.hjson');

// 修改配置
config.server.port = 8080;
config.features.push('newFeature');

// 保存（保留注释）
await save('config.hjson', config);
```

### 配置继承和合并

```typescript
import { parse, deepMerge, save } from 'hjson-topology-toolkit';
import { readFileSync } from 'fs';

const base = parse(readFileSync('base.hjson', 'utf-8'));
const dev = parse(readFileSync('development.hjson', 'utf-8'));
const local = parse(readFileSync('local.hjson', 'utf-8'));

const config = deepMerge(base, dev, local);
await save('final.config.hjson', config);
```

## 数据清洗

### 移除敏感信息

```typescript
import { replaceAll } from 'hjson-topology-toolkit';

function sanitize(data: unknown) {
  const sensitivePattern = /password|secret|token|key|credential/i;
  
  return replaceAll(data, (info) => {
    return sensitivePattern.test(String(info.key));
  }, '***');
}

const sanitized = sanitize(apiResponse);
```

### 标准化数据格式

```typescript
import { map } from 'hjson-topology-toolkit';

const normalized = map(rawData, (info) => {
  // 标准化日期
  if (info.key === 'date' || info.key === 'createdAt') {
    return new Date(info.value).toISOString();
  }
  
  // 标准化字符串
  if (typeof info.value === 'string') {
    return info.value.trim().toLowerCase();
  }
  
  // 标准化布尔值
  if (['yes', 'true', '1'].includes(String(info.value))) {
    return true;
  }
  if (['no', 'false', '0'].includes(String(info.value))) {
    return false;
  }
  
  return info.value;
});
```

## API 响应处理

### 过滤响应数据

```typescript
import { chain } from 'hjson-topology-toolkit';

function processUserResponse(response: unknown) {
  return chain(response)
    // 移除敏感字段
    .filter(info => !['password', 'ssn'].includes(String(info.key)))
    // 转换头像 URL
    .map(info => {
      if (info.key === 'avatar') {
        return `https://cdn.example.com/${info.value}`;
      }
      return info.value;
    })
    // 扁平化地址
    .flatten({ delimiter: '_', maxDepth: 2 })
    .value();
}
```

### 批量数据验证

```typescript
import { validate, map } from 'hjson-topology-toolkit';

const userSchema = {
  type: 'object',
  required: ['id', 'name', 'email'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string', minLength: 2 },
    email: { type: 'string', format: 'email' }
  }
};

async function validateUsers(users: unknown[]) {
  const results = await Promise.all(
    users.map(async user => {
      const result = await validate(user, userSchema);
      return {
        user,
        valid: result.valid,
        errors: result.errors
      };
    })
  );
  
  return {
    valid: results.filter(r => r.valid),
    invalid: results.filter(r => !r.valid)
  };
}
```

## 日志分析

### 提取错误信息

```typescript
import { findAll, chain } from 'hjson-topology-toolkit';

function extractErrors(logs: unknown[]) {
  return logs.flatMap(log => {
    const errorNodes = findAll(log, (info) => {
      return info.key === 'level' && info.value === 'error';
    });
    
    return errorNodes.map(node => ({
      path: node.path,
      timestamp: chain(log).get('timestamp'),
      message: chain(log).get('message')
    }));
  });
}
```

### 统计日志级别

```typescript
import { reduce } from 'hjson-topology-toolkit';

function countLogLevels(logs: unknown[]) {
  return reduce(logs, (acc, info) => {
    if (info.key === 'level') {
      const level = String(info.value);
      acc[level] = (acc[level] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}
```

## 数据库操作

### 异步数据填充

```typescript
import { asyncMap } from 'hjson-topology-toolkit/async';

async function enrichOrders(orders: unknown[]) {
  return asyncMap(orders, async (info) => {
    if (info.key === 'userId') {
      return await db.users.findById(info.value);
    }
    if (info.key === 'productId') {
      return await db.products.findById(info.value);
    }
    return info.value;
  }, { concurrency: 5 });
}
```

### 批量更新

```typescript
import { asyncBFS } from 'hjson-topology-toolkit/async';

async function updateStatus(items: unknown[], newStatus: string) {
  await asyncBFS(items, async (info) => {
    if (info.key === 'status') {
      await db.items.update(
        { id: info.parent?.id },
        { status: newStatus }
      );
    }
  }, { concurrency: 10 });
}
```

## 前端状态管理

### Redux Action 处理

```typescript
import { chain } from 'hjson-topology-toolkit';

function reducer(state = initialState, action: Action) {
  switch (action.type) {
    case 'UPDATE_USER':
      return chain(state)
        .set('user', { ...state.user, ...action.payload })
        .set('lastUpdated', Date.now())
        .value();
      
    case 'REMOVE_ITEM':
      return chain(state)
        .remove(`items.${action.index}`)
        .value();
      
    default:
      return state;
  }
}
```

### 表单数据处理

```typescript
import { flatten, unflatten } from 'hjson-topology-toolkit';

// 将表单数据转为嵌套对象
function parseFormData(formData: FormData) {
  const flat: Record<string, string> = {};
  formData.forEach((value, key) => {
    flat[key] = String(value);
  });
  return unflatten(flat, { delimiter: '_' });
}

// 将对象转为表单字段
function toFormData(data: unknown) {
  const flat = flatten(data, { delimiter: '_' });
  const formData = new FormData();
  Object.entries(flat).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  return formData;
}
```

## 测试数据生成

### 生成随机测试数据

```typescript
import { map } from 'hjson-topology-toolkit';

function generateTestData(template: unknown) {
  return map(template, (info) => {
    if (info.value === '{{name}}') {
      return faker.name.fullName();
    }
    if (info.value === '{{email}}') {
      return faker.internet.email();
    }
    if (info.value === '{{uuid}}') {
      return faker.datatype.uuid();
    }
    if (info.value === '{{date}}') {
      return faker.date.recent().toISOString();
    }
    return info.value;
  });
}
```

### 数据混淆

```typescript
import { map } from 'hjson-topology-toolkit';

function obfuscate(data: unknown) {
  return map(data, (info) => {
    if (info.key === 'email') {
      return String(info.value).replace(/(.{2}).+(@.+)/, '$1***$2');
    }
    if (info.key === 'phone') {
      return String(info.value).replace(/\d(?=\d{4})/g, '*');
    }
    if (info.key === 'name') {
      return faker.name.fullName();
    }
    return info.value;
  });
}
```

## 更多示例

查看指南部分了解更多使用场景：

- [遍历指南](../guide/traverse)
- [查找指南](../guide/find)
- [转换指南](../guide/transform)
- [链式 API 指南](../guide/chain)
- [异步操作指南](../guide/async)
