# HJSON 支持

HJSON (Human JSON) 是一种更适合人类读写的 JSON 变体，支持注释、无引号键名、单引号字符串等特性。

## HJSON vs JSON

| 特性 | HJSON | JSON |
|------|-------|------|
| 注释 | ✅ 支持 | ❌ 不支持 |
| 无引号键名 | ✅ 支持 | ❌ 不支持 |
| 单引号字符串 | ✅ 支持 | ❌ 不支持 |
| 尾随逗号 | ✅ 支持 | ❌ 不支持 |
| 多行字符串 | ✅ 支持 | ❌ 不支持 |

## 解析 HJSON

```typescript
import { parse, parseSync, parseSafe } from 'hjson-topology-toolkit';

const hjsonText = `
{
  # 服务器配置
  server: {
    host: localhost
    port: 3000
  },
  
  /* 数据库配置
     支持多行注释 */
  database: {
    url: 'postgresql://localhost/mydb'
  },
  
  features: [
    auth
    logging
    metrics,
  ]
}
`;

// 异步解析
const data = await parse(hjsonText);

// 同步解析
const data = parseSync(hjsonText);

// 安全解析（失败返回 null）
const data = parseSafe(hjsonText);
```

## 序列化为 HJSON

```typescript
import { stringify, stringifySync } from 'hjson-topology-toolkit';

const data = {
  name: 'My App',
  version: '1.0.0',
  config: {
    debug: true
  }
};

// 基本序列化
const hjson = stringifySync(data);

// 带选项
const hjson = stringifySync(data, {
  bracesSameLine: true,    // 大括号与键同行
  quotes: 'min',           // 最小引号使用
  space: 2,                // 缩进空格数
  separator: true,         // 键值对分隔符
  condense: 80             // 行宽限制
});
```

### 引号选项

```typescript
// 'min' - 最小使用（默认）
stringify(data, { quotes: 'min' });
// { name: "test" }  // 需要时加引号

// 'keys' - 键名加引号
stringify(data, { quotes: 'keys' });
// { "name": "test" }

// 'all' - 全部加引号
stringify(data, { quotes: 'all' });
// { "name": "test", "value": 123 }

// 'strings' - 只给字符串加引号
stringify(data, { quotes: 'strings' });
// { name: "test", count: 123 }
```

## 格式化

```typescript
import { format, minify } from 'hjson-topology-toolkit';

// 格式化 HJSON/JSON
const formatted = await format(rawText, {
  bracesSameLine: true,
  space: 2
});

// 压缩为 JSON
const compressed = await minify(rawText);
```

## 文件操作

```typescript
import { load, loadSync, save, saveSync } from 'hjson-topology-toolkit';

// 异步读取
const config = await load('config.hjson');

// 同步读取
const config = loadSync('config.hjson');

// 异步保存
await save('output.hjson', data, {
  bracesSameLine: true,
  space: 2
});

// 同步保存
saveSync('output.hjson', data);
```

## JSON 与 HJSON 互转

```typescript
import { convertJSONtoHJSON, convertHJSONtoJSON } from 'hjson-topology-toolkit';

// JSON 转 HJSON
const json = '{"name":"test","count":123}';
const hjson = await convertJSONtoHJSON(json);
// {
//   name: "test"
//   count: 123
// }

// HJSON 转 JSON
const hjson = 'name: test\ncount: 123';
const json = await convertHJSONtoJSON(hjson, { space: 2 });
// {
//   "name": "test",
//   "count": 123
// }
```

## 格式检测

```typescript
import { isHJSON, isJSON, detectFormat } from 'hjson-topology-toolkit';

// 检查是否为有效的 HJSON
if (isHJSON(text)) {
  console.log('Valid HJSON');
}

// 检查是否为有效的 JSON
if (isJSON(text)) {
  console.log('Valid JSON');
}

// 检测格式
const format = detectFormat(text);
console.log(format); // 'hjson', 'json', 或 'invalid'
```

## 使用 HJSON 类

```typescript
import { HJSON } from 'hjson-topology-toolkit';

// 创建实例
const hjson = new HJSON({ name: 'test' });

// 从字符串解析
const hjson = await HJSON.parse(hjsonText);

// 从文件加载
const hjson = await HJSON.load('config.hjson');

// 路径操作
hjson.setPath('server.port', 8080);
const port = hjson.getPath('server.port');

// 保存
await hjson.save('output.hjson');

// 序列化
console.log(hjson.toJSON());
console.log(hjson.toHJSON());
```

## 合并 HJSON

```typescript
import { merge } from 'hjson-topology-toolkit';

const baseConfig = await load('base.hjson');
const localConfig = await load('local.hjson');

const merged = await merge(baseConfig, localConfig);
```

## 比较 HJSON

```typescript
import { diff } from 'hjson-topology-toolkit';

const hjson1 = 'name: test\nvalue: 123';
const hjson2 = 'name: test\nvalue: 456\nnew: added';

const differences = await diff(hjson1, hjson2);
console.log(differences);
// {
//   added: { new: 'added' },
//   removed: {},
//   modified: { value: { old: 123, new: 456 } }
// }
```

## 保留注释

```typescript
import { parse, stringify } from 'hjson-topology-toolkit';

const hjsonText = `
{
  # 这是注释
  name: test
}
`;

// 解析时保留注释
const data = parse(hjsonText, { keepWsc: true });

// 序列化时保留注释
const output = stringify(data, { keepWsc: true });
```

## 实际应用场景

### 配置文件管理

```typescript
import { parse, stringify, load, save } from 'hjson-topology-toolkit';

// 读取用户友好的配置文件
const config = await load('app.config.hjson');

// 修改配置
config.server.port = 8080;

// 保存，保留注释
await save('app.config.hjson', config);
```

### 配置文件模板

```typescript
import { HJSON } from 'hjson-topology-toolkit';

const template = `
{
  # 应用名称
  name: My Application
  
  # 服务器配置
  server: {
    host: localhost
    port: 3000
  }
  
  # 数据库配置
  database: {
    type: postgresql
    url: "postgresql://user:pass@localhost/db"
  }
}
`;

const hjson = await HJSON.parse(template);
hjson.setPath('name', process.env.APP_NAME || 'My App');
await hjson.save('config.hjson');
```

### 配置验证与合并

```typescript
import { parse, validate, deepMerge } from 'hjson-topology-toolkit';
import { readFileSync } from 'fs';

const schema = {
  type: 'object',
  required: ['name', 'server'],
  properties: {
    name: { type: 'string' },
    server: {
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'number' }
      }
    }
  }
};

function loadAndValidate(path: string) {
  const text = readFileSync(path, 'utf-8');
  const config = parse(text);
  
  const result = validateSync(config, schema);
  if (!result.valid) {
    throw new Error(`Config validation failed: ${result.errors?.[0].message}`);
  }
  
  return config;
}

// 合并多个配置文件
const base = loadAndValidate('base.hjson');
const env = loadAndValidate(`${process.env.NODE_ENV}.hjson`);
const local = loadAndValidate('local.hjson');

const config = deepMerge(base, env, local);
```

## HJSON 语法参考

```hjson
{
  # 行尾注释
  
  /* 多行
     注释 */
  
  # 无引号键名
  key: value
  
  # 带引号键名（特殊字符时需要）
  "key-with-dash": value
  
  # 字符串值
  singleQuotes: '单引号字符串'
  doubleQuotes: "双引号字符串"
  noQuotes: 无引号（只能是字母数字下划线）
  
  # 多行字符串
  multiline: '''
    第一行
    第二行
    第三行
  '''
  
  # 数字
  integer: 42
  float: 3.14
  negative: -10
  
  # 布尔值
  active: true
  debug: false
  
  # null
  empty: null
  
  # 数组
  list: [
    item1
    item2
    item3,
  ]
  
  # 对象
  nested: {
    key: value
    another: {
      deep: value
    }
  }
}
```
