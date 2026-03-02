# 验证

验证功能基于 JSON Schema 标准，帮助你确保数据结构符合预期。

## 基本验证

```typescript
import { validate } from 'hjson-topology-toolkit';

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0 }
  }
};

const data = {
  name: 'Alice',
  email: 'alice@example.com',
  age: 30
};

// 异步验证
const result = await validate(data, schema);

if (result.valid) {
  console.log('Valid!');
} else {
  console.log('Errors:', result.errors);
}
```

## 同步验证

```typescript
import { validateSync } from 'hjson-topology-toolkit';

const result = validateSync(data, schema);

if (!result.valid) {
  result.errors?.forEach(error => {
    console.log(`${error.path}: ${error.message}`);
  });
}
```

## 验证选项

```typescript
const result = await validate(data, schema, {
  strict: true,        // 严格模式
  allErrors: true,     // 返回所有错误（不只是第一个）
  useDefaults: true,   // 使用默认值
  coerceTypes: true    // 自动类型转换
});
```

## 验证结果

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

interface ValidationError {
  message: string;      // 错误信息
  path: string;         // 错误路径
  value: unknown;       // 导致错误的值
  schemaPath?: string;  // Schema 路径
}
```

## Schema 示例

### 对象验证

```typescript
const userSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    age: { 
      type: 'integer', 
      minimum: 0, 
      maximum: 150 
    }
  },
  additionalProperties: false  // 禁止额外属性
};
```

### 数组验证

```typescript
const listSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' }
    }
  },
  minItems: 1,
  maxItems: 100
};
```

### 嵌套验证

```typescript
const configSchema = {
  type: 'object',
  properties: {
    server: {
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'number', minimum: 1, maximum: 65535 }
      },
      required: ['host', 'port']
    },
    database: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        pool: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          }
        }
      }
    }
  }
};
```

### 枚举和常量

```typescript
const statusSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['pending', 'active', 'inactive']
    },
    role: {
      const: 'admin'  // 必须是特定值
    }
  }
};
```

### 模式匹配

```typescript
const schema = {
  type: 'object',
  properties: {
    phone: {
      type: 'string',
      pattern: '^\\+?[1-9]\\d{1,14}$'  // E.164 格式
    },
    code: {
      type: 'string',
      pattern: '^[A-Z]{3}-\\d{4}$'     // ABC-1234 格式
    }
  }
};
```

## 使用 Validator 类

```typescript
import { Validator } from 'hjson-topology-toolkit';

const validator = new Validator();

// 注册 Schema
validator.register('user', userSchema);
validator.register('config', configSchema);

// 验证
const result = validator.validateSync('user', data);

// 获取默认值
const defaults = validator.getDefaults('config');

// 检查 Schema 是否存在
if (validator.hasSchema('user')) {
  // ...
}
```

## 创建预编译验证器

```typescript
import { createValidator } from 'hjson-topology-toolkit';

// 创建预编译的验证函数
const validateUser = await createValidator(userSchema);

// 多次使用（性能更好）
for (const user of users) {
  const result = validateUser(user);
  if (!result.valid) {
    console.log(result.errors);
  }
}
```

## 验证并抛出错误

```typescript
import { validateOrThrow } from 'hjson-topology-toolkit';

try {
  await validateOrThrow(data, schema);
  console.log('Valid!');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

## 验证数组项

```typescript
import { validateArray } from 'hjson-topology-toolkit';

const results = await validateArray(users, userSchema);

for (const { index, result } of results) {
  if (!result.valid) {
    console.log(`User ${index} is invalid:`, result.errors);
  }
}
```

## 获取默认值

```typescript
import { getDefaults } from 'hjson-topology-toolkit';

const defaults = getDefaults({
  type: 'object',
  properties: {
    name: { type: 'string', default: 'Anonymous' },
    active: { type: 'boolean', default: true },
    count: { type: 'number', default: 0 }
  }
});

console.log(defaults);
// { name: 'Anonymous', active: true, count: 0 }
```

## 使用链式 API 验证

```typescript
import { chain } from 'hjson-topology-toolkit';

const result = chain(data)
  .validateSync(userSchema);

if (!result.valid) {
  console.log(result.errors);
}

// 或者异步验证
const chain = chain(data);
const validation = await chain.validate(userSchema);
```

## 自定义错误消息

```typescript
const schema = {
  type: 'object',
  properties: {
    age: {
      type: 'number',
      minimum: 18,
      maximum: 100,
      errorMessage: {
        type: '年龄必须是数字',
        minimum: '年龄必须满18岁',
        maximum: '年龄不能超过100岁'
      }
    }
  }
};
```

## 条件验证

```typescript
const schema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    details: {}
  },
  if: {
    properties: { type: { const: 'user' } }
  },
  then: {
    properties: {
      details: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  },
  else: {
    properties: {
      details: {
        type: 'object',
        properties: {
          title: { type: 'string' }
        }
      }
    }
  }
};
```

## 实际应用场景

### API 请求验证

```typescript
import { validate } from 'hjson-topology-toolkit';

async function createUser(req: Request) {
  const userSchema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' }
    }
  };
  
  const result = await validate(req.body, userSchema);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  
  // 继续创建用户
}
```

### 配置文件验证

```typescript
import { validateOrThrow, parse } from 'hjson-topology-toolkit';
import { readFileSync } from 'fs';

function loadConfig(path: string) {
  const configSchema = {
    type: 'object',
    required: ['server', 'database'],
    properties: {
      server: {
        type: 'object',
        required: ['host', 'port'],
        properties: {
          host: { type: 'string' },
          port: { type: 'number', minimum: 1, maximum: 65535 }
        }
      }
    }
  };
  
  const content = readFileSync(path, 'utf-8');
  const config = parse(content);
  
  validateOrThrow(config, configSchema);
  return config;
}
```
