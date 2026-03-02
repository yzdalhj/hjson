# 介绍

**HJSON Topology Toolkit** 是一个强大的 JavaScript/TypeScript 库，专注于处理 JSON 和 HJSON 数据的拓扑结构。它提供了丰富的 API 来遍历、查找、转换和验证复杂的数据结构。

## 什么是拓扑处理？

在处理 JSON 数据时，我们经常需要：

- 遍历深层嵌套的对象和数组
- 根据条件查找特定节点
- 批量转换数据格式
- 验证数据结构是否符合预期
- 处理带有注释的配置文件 (HJSON)

这些操作涉及数据的**拓扑结构**——即数据节点之间的关系和层次。HJSON Topology Toolkit 正是为解决这些问题而设计的。

## 设计理念

### 1. 功能完备
提供完整的数据处理工具集，从简单的路径查找到复杂的异步批量操作。

### 2. 易于使用
提供函数式 API、链式 API 和面向对象的类，满足不同使用场景。

### 3. 类型安全
完全使用 TypeScript 编写，提供完整的类型定义和智能提示。

### 4. 高性能
优化的遍历算法，支持并发控制和内存高效的处理方式。

## 核心概念

### 节点信息 (NodeInfo)

所有操作都围绕 `NodeInfo` 对象进行，它包含：

```typescript
interface NodeInfo<T> {
  value: T;                    // 节点值
  key: string | number;        // 节点键
  path: (string | number)[];   // 完整路径
  depth: number;               // 深度层级
  parent?: unknown;            // 父节点引用
  isRoot: boolean;             // 是否为根节点
  isLeaf: boolean;             // 是否为叶子节点
}
```

### 遍历模式

- **BFS (广度优先)**：按层级遍历，先访问所有兄弟节点再进入子节点
- **DFS (深度优先)**：递归深入，先访问子节点再访问兄弟节点
  - 前序遍历：先访问节点本身，再访问子节点
  - 后序遍历：先访问子节点，再访问节点本身

### 查找条件

支持多种查找条件形式：

```typescript
// 对象条件
find(data, { key: 'name', value: 'Alice' });

// 函数条件
find(data, (info) => info.depth > 2 && typeof info.value === 'string');

// 正则条件
find(data, /^test_/);

// 简单值匹配
find(data, 'targetValue');
```

## 使用场景

### 配置文件处理

```typescript
import { parse, stringify, chain } from 'hjson-topology-toolkit';

// 读取带注释的 HJSON 配置
const config = parse(`
{
  // 数据库配置
  database: {
    host: localhost
    port: 3306
  }
}
`);

// 修改配置
const updated = chain(config)
  .set('database.port', 5432)
  .value();

// 保存回 HJSON
console.log(stringify(updated, { bracesSameLine: true }));
```

### 数据清洗

```typescript
import { replaceAll, filter } from 'hjson-topology-toolkit';

// 移除所有敏感信息
const sanitized = replaceAll(
  data,
  /password|secret|token/i,
  '[REDACTED]'
);

// 过滤掉空值
const cleaned = filter(data, (info) => {
  return info.value !== null && info.value !== undefined && info.value !== '';
});
```

### 批量转换

```typescript
import { map } from 'hjson-topology-toolkit';

// 将所有字符串转为小写
const normalized = map(data, (info) => {
  return typeof info.value === 'string' 
    ? info.value.toLowerCase().trim()
    : info.value;
});
```

### 数据验证

```typescript
import { validate } from 'hjson-topology-toolkit';

const schema = {
  type: 'object',
  required: ['users'],
  properties: {
    users: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }
};

const result = await validate(data, schema);
if (!result.valid) {
  console.error(result.errors);
}
```

## 下一步

- [快速开始](./getting-started) - 了解基本用法
- [安装指南](./installation) - 详细的安装说明
- [API 文档](../api/) - 完整的 API 参考
