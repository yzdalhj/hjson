# 转换 API

## map

深度映射转换。

```typescript
function map<T = NodeValue, R = NodeValue>(
  root: T,
  callback: MapFunction<T, R>,
  options?: { mode?: TraverseMode; maxDepth?: number }
): T | R
```

### 示例

```typescript
import { map } from 'hjson-topology-toolkit';

const result = map(data, (info) => {
  return typeof info.value === 'string' 
    ? info.value.toUpperCase() 
    : info.value;
});
```

## filter

深度过滤。

```typescript
function filter<T = NodeValue>(
  root: T,
  callback: FilterFunction<T>,
  options?: { maxDepth?: number }
): T
```

## reduce

深度归约。

```typescript
function reduce<T = NodeValue, R = NodeValue>(
  root: T,
  callback: ReduceFunction<T, R>,
  initial: R,
  options?: { mode?: TraverseMode; maxDepth?: number }
): R
```

## replace / replaceAll

替换节点。

```typescript
function replace<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  replacement: ReplaceFunction<T> | NodeValue,
  options?: ReplaceOptions
): T

function replaceAll<T = NodeValue>(
  root: T,
  condition: FindCondition<T>,
  replacement: ReplaceFunction<T> | NodeValue,
  options?: ReplaceOptions
): T
```

### 示例

```typescript
import { replace, replaceAll } from 'hjson-topology-toolkit';

// 替换单个节点
const result = replace(data, { key: 'status' }, { value: 'active' });

// 替换所有匹配节点
const result = replaceAll(data, 'localhost', '127.0.0.1');
```

## flatten

扁平化。

```typescript
function flatten(
  root: NodeValue,
  options?: FlattenOptions
): Record<string, NodeValue>
```

### FlattenOptions

```typescript
interface FlattenOptions {
  delimiter?: string;    // 默认 '.'
  maxDepth?: number;
  includeArrays?: boolean;  // 默认 true
}
```

## unflatten

反扁平化。

```typescript
function unflatten(
  flatData: Record<string, NodeValue>,
  options?: { delimiter?: string }
): NodeValue
```

## clone

深度克隆。

```typescript
function clone<T = NodeValue>(value: T): T
```

## deepMerge

深度合并。

```typescript
function deepMerge<T = NodeValue>(...objects: T[]): T
```

## pick

选取指定路径。

```typescript
function pick<T = NodeValue>(
  obj: T,
  paths: (string | Path)[]
): Partial<T>
```

## omit

排除指定路径。

```typescript
function omit<T = NodeValue>(
  obj: T,
  paths: (string | Path)[]
): Partial<T>
```

## Transform 类

```typescript
import { Transform } from 'hjson-topology-toolkit';

const result = new Transform(data)
  .map(callback)
  .filter(callback)
  .flatten()
  .value();
```
