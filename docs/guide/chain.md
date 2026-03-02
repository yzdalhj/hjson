# 链式 API

链式 API 提供流畅的接口设计，让你可以连续调用多个方法处理数据。

## 创建链式实例

```typescript
import { chain, hjson } from 'hjson-topology-toolkit';

// 两种方式创建
const c1 = chain(data);
const c2 = hjson(data);

// 从 JSON/HJSON 字符串创建
const c3 = chain.fromJSON('{"name":"test"}');
```

## 基础链式操作

```typescript
import { chain } from 'hjson-topology-toolkit';

const result = chain(data)
  // 过滤掉敏感信息
  .filter(info => !['password', 'secret'].includes(String(info.key)))
  // 转换所有字符串为大写
  .map(info => typeof info.value === 'string' ? info.value.toUpperCase() : info.value)
  // 替换特定值
  .replace('localhost', '127.0.0.1')
  // 获取结果
  .value();
```

## 查找操作

```typescript
const result = chain(data)
  // 查找单个节点
  .find({ key: 'name' })
  ?.value;

// 查找所有匹配
const results = chain(data)
  .findAll({ value: 'active' })
  .map(info => info.path);
```

## 路径操作

```typescript
const result = chain(data)
  // 获取路径值
  .get('users.0.name')
  // 设置路径值
  .set('users.0.name', 'New Name')
  // 删除路径值
  .remove('users.0.password')
  .value();
```

## 转换操作

```typescript
const result = chain(data)
  // 映射
  .map(info => {
    if (info.key === 'timestamp') {
      return new Date(info.value).toISOString();
    }
    return info.value;
  })
  // 过滤
  .filter(info => info.value !== null)
  // 归约
  .reduce((acc, info) => {
    return typeof info.value === 'number' ? acc + info.value : acc;
  }, 0);
```

## 条件操作

### when - 条件执行

```typescript
const result = chain(data)
  // 只有当条件为 true 时才执行
  .when(data.users.length > 0, ch => 
    ch.filter(info => info.key === 'active')
  )
  .when(process.env.NODE_ENV === 'production', ch =>
    ch.replace('debug', false)
  )
  .value();
```

### if - 条件分支

```typescript
const result = chain(data)
  .if(data.version === 1)
    .then(ch => ch.set('legacy', true))
    .else(ch => ch.set('legacy', false))
  .value();
```

## 数据转换

```typescript
const result = chain(data)
  // 扁平化
  .flatten({ delimiter: '.' })
  // 或者反扁平化
  .unflatten(flatData)
  // 克隆
  .clone()
  // 合并其他数据
  .merge(otherData1, otherData2)
  // 选取字段
  .pick(['name', 'email'])
  // 排除字段
  .omit(['password', 'token'])
  .value();
```

## 验证

```typescript
const result = chain(data)
  // 同步验证
  .validateSync(schema);

// 异步验证
const chain = chain(data);
const validation = await chain.validate(schema);
if (validation.valid) {
  console.log('Valid!');
} else {
  console.log(validation.errors);
}
```

## 类型检查

```typescript
const chain = chain(data);

// 类型检查
if (chain.isArray()) {
  console.log('Is array');
}

if (chain.isObject()) {
  console.log('Keys:', chain.keys());
}

if (chain.isEmpty()) {
  console.log('Empty');
}

console.log('Size:', chain.size());
```

## 序列化

```typescript
const chain = chain(data);

// 转为 JSON
const json = chain.toJSON(2); // 2 空格缩进

// 转为 HJSON
const hjson = chain.toHJSON({ bracesSameLine: true });
```

## 管道操作

```typescript
const result = chain(data)
  .pipe(data => {
    // 自定义转换
    return processWithLodash(data);
  })
  .pipe(data => {
    // 另一个自定义转换
    return validateData(data);
  })
  .value();
```

## 转换为其他类

```typescript
const chain = chain(data);

// 转为 Traverser
const traverser = chain.toTraverser();

// 转为 Finder
const finder = chain.toFinder();

// 转为 Transform
const transform = chain.toTransform();

// 转为 HJSON 类
const hjson = chain.toHJSONClass();
```

## 迭代器

```typescript
const chain = chain(data);

// 使用 for...of 遍历
for (const nodeInfo of chain) {
  console.log(nodeInfo.path.join('.'));
}
```

## 链式操作的最佳实践

### 1. 分解复杂操作

```typescript
// 不好的做法 - 太长的链
const result = chain(data)
  .filter(...)
  .map(...)
  .replace(...)
  .filter(...)
  .map(...)
  .value();

// 好的做法 - 分解为步骤
const cleaned = chain(data).filter(...).value();
const transformed = chain(cleaned).map(...).value();
const final = chain(transformed).replace(...).value();
```

### 2. 错误处理

```typescript
try {
  const result = chain(data)
    .map(info => {
      if (info.key === 'date') {
        const parsed = new Date(info.value);
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid date: ${info.value}`);
        }
        return parsed.toISOString();
      }
      return info.value;
    })
    .value();
} catch (error) {
  console.error('Processing failed:', error);
}
```

### 3. 条件链式

```typescript
function processData(data: unknown, options: Options) {
  let c = chain(data);
  
  if (options.sanitize) {
    c = c.filter(info => !isSensitive(info.key));
  }
  
  if (options.normalize) {
    c = c.map(info => normalizeValue(info.value));
  }
  
  if (options.flatten) {
    return c.flatten().value();
  }
  
  return c.value();
}
```

## 实际应用场景

### 配置处理

```typescript
function loadConfig(configPath: string) {
  return chain(parse(fs.readFileSync(configPath, 'utf-8')))
    .when(process.env.NODE_ENV === 'production', ch =>
      ch.replace('debug', false)
        .replace('logLevel', 'error')
    )
    .map(info => {
      if (info.key === 'port') {
        return parseInt(String(info.value), 10);
      }
      return info.value;
    })
    .value();
}
```

### API 响应处理

```typescript
async function fetchUsers() {
  const response = await fetch('/api/users');
  const data = await response.json();
  
  return chain(data)
    .filter(info => info.key !== 'password')
    .map(info => {
      if (info.key === 'avatar') {
        return `https://cdn.example.com/${info.value}`;
      }
      return info.value;
    })
    .value();
}
```
