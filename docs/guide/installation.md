# 安装

## 环境要求

- **Node.js**: >= 14.0.0
- **TypeScript**: >= 4.5.0 (如果使用 TypeScript)

## 包管理器安装

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

## 模块格式

本库提供以下模块格式：

- **ESM** (`.mjs`) - 推荐用于现代项目
- **CommonJS** (`.cjs`) - 用于 Node.js 传统项目
- **TypeScript** (`.d.ts`) - 完整的类型定义

## 导入方式

### ESM (推荐)

```typescript
// 导入所有功能
import * as hjson from 'hjson-topology-toolkit';

// 导入特定功能
import { chain, find, traverse } from 'hjson-topology-toolkit';

// 导入异步功能
import { asyncChain, asyncFind } from 'hjson-topology-toolkit/async';
```

### CommonJS

```javascript
// 导入所有功能
const hjson = require('hjson-topology-toolkit');

// 解构导入
const { chain, find, traverse } = require('hjson-topology-toolkit');

// 异步功能
const { asyncChain } = require('hjson-topology-toolkit/async');
```

### CDN

```html
<script type="module">
  import { chain, find } from 'https://unpkg.com/hjson-topology-toolkit/dist/index.mjs';
  
  const data = { name: 'test' };
  const result = chain(data).value();
</script>
```

## TypeScript 配置

确保你的 `tsconfig.json` 包含以下配置：

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## 验证安装

创建一个测试文件：

```typescript
// test.ts
import { chain, find, traverse } from 'hjson-topology-toolkit';

const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]
};

// 测试链式 API
const result = chain(data)
  .find({ key: 'name' })
  ?.value;

console.log('Test passed:', result === 'Alice');
```

运行测试：

```bash
npx ts-node test.ts
```

## 故障排除

### "Cannot find module"

确保安装了 TypeScript 类型声明（如果需要）：

```bash
npm install -D @types/node
```

### 导入错误

如果遇到导入错误，尝试：

```typescript
// 使用默认导入
import hjson from 'hjson-topology-toolkit';

// 然后使用
hjson.chain(data);
```

### 打包工具配置

#### Vite

```typescript
// vite.config.ts
export default {
  resolve: {
    alias: {
      'hjson-topology-toolkit': 'hjson-topology-toolkit/dist/index.mjs'
    }
  }
}
```

#### Webpack

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'hjson-topology-toolkit': path.resolve(
        __dirname,
        'node_modules/hjson-topology-toolkit/dist/index.mjs'
      )
    }
  }
}
```

#### Rollup

```javascript
// rollup.config.js
export default {
  external: ['hjson-topology-toolkit']
}
```

## 下一步

- [快速开始](./getting-started) - 学习基本用法
- [指南](./traverse) - 深入了解各项功能
