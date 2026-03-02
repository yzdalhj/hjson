---
layout: home

hero:
  name: "HJSON Topology Toolkit"
  text: "强大的 JSON/HJSON\n拓扑处理工具"
  tagline: 支持遍历、查找、转换、验证等功能的现代化数据处理库
  image:
    src: /logo.svg
    alt: HJSON Topology Toolkit
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 文档
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/yourusername/hjson-topology-toolkit

features:
  - icon: 🌲
    title: 拓扑遍历
    details: 支持 BFS 广度优先和 DFS 深度优先两种遍历模式，支持前序/后序遍历
  - icon: 🔍
    title: 深度查找
    details: 支持条件查找、路径查找、XPath 风格查询、父节点和兄弟节点查找
  - icon: 🔄
    title: 数据转换
    details: 映射、过滤、归约、扁平化、深度克隆、智能替换
  - icon: ✅
    title: Schema 验证
    details: 基于 AJV 的 JSON Schema 验证，支持异步验证和自定义规则
  - icon: ⛓️
    title: 链式 API
    details: 流畅的接口设计，支持方法链式调用和条件操作
  - icon: ⚡
    title: 异步支持
    details: 完整的异步操作支持，包括并发控制、超时和取消信号
---

## 快速开始

### 安装

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

### 基本用法

```typescript
import { chain, find, traverse } from 'hjson-topology-toolkit';

const data = {
  users: [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false }
  ]
};

// 使用链式 API
const result = chain(data)
  .filter(info => info.key !== 'active')
  .map(info => typeof info.value === 'string' ? info.value.toUpperCase() : info.value)
  .value();

// 深度查找
const user = find(data, { key: 'name', value: 'Alice' });

// 遍历所有节点
traverse(data, (info) => {
  console.log(`${info.path.join('.')}: ${info.value}`);
});
```

## 特性对比

| 特性 | hjson-topology-toolkit | lodash | native |
|------|------------------------|--------|--------|
| 深度遍历 | ✅ BFS/DFS | ❌ | ❌ |
| 条件查找 | ✅ 强大灵活 | ⚠️ 有限 | ❌ |
| 链式 API | ✅ 完整支持 | ✅ | ❌ |
| 异步支持 | ✅ 并发控制 | ❌ | ❌ |
| HJSON 支持 | ✅ 内置 | ❌ | ❌ |
| 类型安全 | ✅ TypeScript | ⚠️ 部分 | ✅ |

## 性能

```
遍历性能 (10万节点):
- BFS: ~50ms
- DFS: ~45ms
- 异步 BFS (并发=10): ~120ms

查找性能 (10万节点):
- find: ~5ms
- findAll: ~15ms
- asyncFind: ~8ms
```

## 浏览器兼容性

- Chrome >= 80
- Firefox >= 75
- Safari >= 13.1
- Edge >= 80
- Node.js >= 14

## 许可证

[MIT](https://github.com/yourusername/hjson-topology-toolkit/blob/main/LICENSE)
