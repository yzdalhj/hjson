# HJSON API

## parse

解析 HJSON 字符串。

```typescript
function parse(text: string, options?: HJSONParseOptions): Promise<NodeValue>
function parseSync(text: string, options?: HJSONParseOptions): NodeValue
function parseSafe(text: string, options?: HJSONParseOptions): NodeValue | null
```

### 示例

```typescript
import { parse, parseSync, parseSafe } from 'hjson-topology-toolkit';

// 异步解析
const data = await parse(hjsonText);

// 同步解析
const data = parseSync(hjsonText);

// 安全解析（失败返回 null）
const data = parseSafe(hjsonText);
```

## stringify

序列化为 HJSON。

```typescript
function stringify(value: NodeValue, options?: HJSONStringifyOptions): Promise<string>
function stringifySync(value: NodeValue, options?: HJSONStringifyOptions): string
```

### HJSONStringifyOptions

```typescript
interface HJSONStringifyOptions {
  bracesSameLine?: boolean;    // 大括号与键同行
  keepWsc?: boolean;           // 保留空白和注释
  quotes?: 'min' | 'keys' | 'all' | 'strings';
  condense?: number;           // 行宽限制
  space?: string | number;     // 缩进
}
```

## format / minify

```typescript
function format(text: string, options?: HJSONStringifyOptions): Promise<string>
function minify(text: string): Promise<string>
function minifySync(text: string): string
```

## load / save

文件操作（Node.js）。

```typescript
function load(filepath: string, options?: HJSONParseOptions): Promise<NodeValue>
function loadSync(filepath: string, options?: HJSONParseOptions): NodeValue
function save(filepath: string, data: NodeValue, options?: HJSONStringifyOptions): Promise<void>
function saveSync(filepath: string, data: NodeValue, options?: HJSONStringifyOptions): void
```

### 示例

```typescript
import { load, save } from 'hjson-topology-toolkit';

const config = await load('config.hjson');
config.port = 8080;
await save('config.hjson', config);
```

## 转换函数

```typescript
// JSON 转 HJSON
function convertJSONtoHJSON(json: string | NodeValue, options?: HJSONStringifyOptions): Promise<string>

// HJSON 转 JSON
function convertHJSONtoJSON(hjson: string, options?: { space?: string | number }): Promise<string>
```

## 检测函数

```typescript
// 检查是否为有效 HJSON
function isHJSON(text: string): boolean

// 检查是否为有效 JSON
function isJSON(text: string): boolean

// 检测格式
function detectFormat(text: string): 'hjson' | 'json' | 'invalid'
```

## HJSON 类

```typescript
import { HJSON } from 'hjson-topology-toolkit';

// 创建实例
const hjson = new HJSON(data);

// 从字符串解析
const hjson = await HJSON.parse(text);

// 从文件加载
const hjson = await HJSON.load('config.hjson');

// 路径操作
hjson.setPath('server.port', 8080);
const port = hjson.getPath('server.port');

// 序列化
hjson.toJSON();
hjson.toHJSON();

// 保存
await hjson.save('output.hjson');
```
