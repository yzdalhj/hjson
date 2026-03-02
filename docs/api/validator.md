# 验证 API

## validate

异步验证。

```typescript
function validate(
  data: NodeValue,
  schema: unknown,
  options?: ValidationOptions
): Promise<ValidationResult>
```

### 示例

```typescript
import { validate } from 'hjson-topology-toolkit';

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' }
  }
};

const result = await validate(data, schema);

if (!result.valid) {
  console.log(result.errors);
}
```

## validateSync

同步验证。

```typescript
function validateSync(
  data: NodeValue,
  schema: unknown,
  options?: ValidationOptions
): ValidationResult
```

## createValidator

创建预编译验证器。

```typescript
function createValidator(
  schema: unknown,
  options?: ValidationOptions
): Promise<(data: NodeValue) => ValidationResult>
```

### 示例

```typescript
import { createValidator } from 'hjson-topology-toolkit';

const validateUser = await createValidator(userSchema);

// 多次使用
for (const user of users) {
  const result = validateUser(user);
}
```

## Validator 类

```typescript
import { Validator } from 'hjson-topology-toolkit';

const validator = new Validator();

validator
  .register('user', userSchema)
  .register('config', configSchema)
  .validate('user', data)
  .getDefaults('user');
```

### 方法

| 方法 | 返回类型 | 描述 |
|------|----------|------|
| `register(name, schema)` | `this` | 注册 Schema |
| `validate(name, data)` | `Promise<ValidationResult>` | 异步验证 |
| `validateSync(name, data)` | `ValidationResult` | 同步验证 |
| `getDefaults(name)` | `NodeValue` | 获取默认值 |
| `hasSchema(name)` | `boolean` | 检查 Schema 是否存在 |
| `unregister(name)` | `this` | 移除 Schema |
| `clear()` | `this` | 清除所有 Schema |

## ValidationOptions

```typescript
interface ValidationOptions {
  strict?: boolean;      // 严格模式
  allErrors?: boolean;   // 返回所有错误
  useDefaults?: boolean; // 使用默认值
  coerceTypes?: boolean; // 自动类型转换
}
```

## ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

interface ValidationError {
  message: string;
  path: string;
  value: NodeValue;
  schemaPath?: string;
}
```

## getDefaults

获取 Schema 的默认数据。

```typescript
function getDefaults(schema: unknown): NodeValue
```
