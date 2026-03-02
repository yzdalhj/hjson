/**
 * HJSON 工具模块
 * 提供 HJSON 与 JSON 的解析、序列化和转换功能
 */

import type { NodeValue, HJSONParseOptions, HJSONStringifyOptions } from '../types';

// 动态导入 hjson 库
let HJSON_LIB: typeof import('hjson') | null = null;

async function getHJSON(): Promise<typeof import('hjson')> {
  if (!HJSON_LIB) {
    HJSON_LIB = await import('hjson');
  }
  return HJSON_LIB;
}

/**
 * 解析 HJSON 字符串为 JavaScript 对象
 * @param text HJSON 字符串
 * @param options 解析选项
 * @returns 解析后的 JavaScript 对象
 */
export async function parse(text: string, options?: HJSONParseOptions): Promise<NodeValue> {
  const hjson = await getHJSON();
  return hjson.parse(text, options);
}

/**
 * 同步解析 HJSON（如果库已加载）
 * @param text HJSON 字符串
 * @param options 解析选项
 * @returns 解析后的 JavaScript 对象
 */
export function parseSync(text: string, options?: HJSONParseOptions): NodeValue {
  if (!HJSON_LIB) {
    // 如果没有 hjson 库，使用原生 JSON.parse 作为回退
    try {
      return JSON.parse(text);
    } catch {
      // 尝试简单的 HJSON 兼容解析
      return parseSimpleHJSON(text);
    }
  }
  return HJSON_LIB.parse(text, options);
}

/**
 * 安全的解析，失败时返回 null
 * @param text HJSON 字符串
 * @param options 解析选项
 * @returns 解析后的对象，失败返回 null
 */
export function parseSafe(text: string, options?: HJSONParseOptions): NodeValue | null {
  try {
    return parseSync(text, options);
  } catch {
    return null;
  }
}

/**
 * 简单的 HJSON 兼容解析（无依赖时的回退方案）
 * @param text HJSON 字符串
 * @returns 解析后的对象
 */
function parseSimpleHJSON(text: string): NodeValue {
  // 移除注释
  let cleaned = text
    // 移除行尾注释
    .replace(/#[^\n]*/g, '')
    // 移除多行注释 /* */
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 处理无引号键名
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // 处理单引号字符串
  cleaned = cleaned.replace(/'([^']*)'/g, '"$1"');
  
  // 移除末尾逗号
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  
  return JSON.parse(cleaned);
}

/**
 * 将对象序列化为 HJSON 字符串
 * @param value 要序列化的对象
 * @param options 序列化选项
 * @returns HJSON 字符串
 */
export async function stringify(value: NodeValue, options?: HJSONStringifyOptions): Promise<string> {
  const hjson = await getHJSON();
  return hjson.stringify(value, options);
}

/**
 * 同步序列化为 HJSON（如果库已加载）
 * @param value 要序列化的对象
 * @param options 序列化选项
 * @returns HJSON 字符串
 */
export function stringifySync(value: NodeValue, options?: HJSONStringifyOptions): string {
  if (!HJSON_LIB) {
    // 如果没有 hjson 库，使用原生 JSON.stringify 作为回退
    return JSON.stringify(value, null, options?.space || 2);
  }
  return HJSON_LIB.stringify(value, options);
}

/**
 * 格式化 HJSON 字符串
 * @param text HJSON 或 JSON 字符串
 * @param options 格式化选项
 * @returns 格式化后的 HJSON 字符串
 */
export async function format(text: string, options?: HJSONStringifyOptions): Promise<string> {
  const data = await parse(text);
  return stringify(data, options);
}

/**
 * 压缩 HJSON/JSON 为最小格式
 * @param text HJSON 或 JSON 字符串
 * @returns 压缩后的 JSON 字符串
 */
export async function minify(text: string): Promise<string> {
  const data = await parse(text);
  return JSON.stringify(data);
}

/**
 * 同步压缩（如果库已加载）
 * @param text HJSON 或 JSON 字符串
 * @returns 压缩后的 JSON 字符串
 */
export function minifySync(text: string): string {
  try {
    const data = parseSync(text);
    return JSON.stringify(data);
  } catch {
    return text;
  }
}

/**
 * 将 JSON 转换为 HJSON
 * @param json JSON 字符串或对象
 * @param options 转换选项
 * @returns HJSON 字符串
 */
export async function convertJSONtoHJSON(
  json: string | NodeValue,
  options?: HJSONStringifyOptions
): Promise<string> {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  return stringify(data, { ...options, quotes: 'min' });
}

/**
 * 将 HJSON 转换为 JSON
 * @param hjson HJSON 字符串
 * @param options 格式化选项
 * @returns JSON 字符串
 */
export async function convertHJSONtoJSON(
  hjson: string,
  options?: { space?: string | number }
): Promise<string> {
  const data = await parse(hjson);
  return JSON.stringify(data, null, options?.space ?? 2);
}

/**
 * 检查字符串是否为有效的 HJSON
 * @param text 要检查的字符串
 * @returns 是否有效
 */
export function isHJSON(text: string): boolean {
  try {
    parseSync(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查字符串是否为有效的 JSON
 * @param text 要检查的字符串
 * @returns 是否有效
 */
export function isJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检测字符串是 HJSON 还是 JSON
 * @param text 要检测的字符串
 * @returns 检测结果
 */
export function detectFormat(text: string): 'hjson' | 'json' | 'invalid' {
  // 先检查是否为有效的 JSON
  if (isJSON(text)) {
    // 再检查是否包含 HJSON 特性
    const hasHJSONFeatures = 
      /#[^\n]*/.test(text) ||           // 有注释
      /\/\*/.test(text) ||              // 有多行注释
      /'[^']*'/.test(text) ||           // 有单引号字符串
      /[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(text) || // 有无引号键名
      /,\s*[}\]]/.test(text);           // 有尾随逗号
    
    return hasHJSONFeatures ? 'hjson' : 'json';
  }
  
  // 检查是否为有效的 HJSON
  if (isHJSON(text)) {
    return 'hjson';
  }
  
  return 'invalid';
}

/**
 * 从文件加载 HJSON（Node.js 环境）
 * @param filepath 文件路径
 * @param options 解析选项
 * @returns 解析后的对象
 */
export async function load(filepath: string, options?: HJSONParseOptions): Promise<NodeValue> {
  // 动态导入 fs 模块
  const fs = await import('fs/promises');
  const text = await fs.readFile(filepath, 'utf-8');
  return parse(text, options);
}

/**
 * 同步从文件加载 HJSON
 * @param filepath 文件路径
 * @param options 解析选项
 * @returns 解析后的对象
 */
export function loadSync(filepath: string, options?: HJSONParseOptions): NodeValue {
  // 使用 require 方式加载 fs
  const fs = require('fs');
  const text = fs.readFileSync(filepath, 'utf-8');
  return parseSync(text, options);
}

/**
 * 保存为 HJSON 文件（Node.js 环境）
 * @param filepath 文件路径
 * @param data 要保存的数据
 * @param options 序列化选项
 */
export async function save(
  filepath: string,
  data: NodeValue,
  options?: HJSONStringifyOptions
): Promise<void> {
  const fs = await import('fs/promises');
  const text = await stringify(data, options);
  await fs.writeFile(filepath, text, 'utf-8');
}

/**
 * 同步保存为 HJSON 文件
 * @param filepath 文件路径
 * @param data 要保存的数据
 * @param options 序列化选项
 */
export function saveSync(filepath: string, data: NodeValue, options?: HJSONStringifyOptions): void {
  const fs = require('fs');
  const text = stringifySync(data, options);
  fs.writeFileSync(filepath, text, 'utf-8');
}

/**
 * 合并多个 HJSON 字符串
 * @param sources 源 HJSON 字符串数组
 * @returns 合并后的 HJSON 字符串
 */
export async function merge(...sources: string[]): Promise<string> {
  const merged: Record<string, NodeValue> = {};
  
  for (const source of sources) {
    const data = await parse(source);
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      Object.assign(merged, data);
    }
  }
  
  return stringify(merged);
}

/**
 * 比较两个 HJSON 字符串的差异
 * @param hjson1 第一个 HJSON
 * @param hjson2 第二个 HJSON
 * @returns 差异对象
 */
export async function diff(
  hjson1: string,
  hjson2: string
): Promise<{ added: Record<string, NodeValue>; removed: Record<string, NodeValue>; modified: Record<string, { old: NodeValue; new: NodeValue }> }> {
  const data1 = await parse(hjson1) as Record<string, NodeValue>;
  const data2 = await parse(hjson2) as Record<string, NodeValue>;
  
  const added: Record<string, NodeValue> = {};
  const removed: Record<string, NodeValue> = {};
  const modified: Record<string, { old: NodeValue; new: NodeValue }> = {};
  
  const keys1 = Object.keys(data1);
  const keys2 = Object.keys(data2);
  
  // 查找新增的键
  for (const key of keys2) {
    if (!(key in data1)) {
      added[key] = data2[key];
    }
  }
  
  // 查找移除的键
  for (const key of keys1) {
    if (!(key in data2)) {
      removed[key] = data1[key];
    }
  }
  
  // 查找修改的键
  for (const key of keys1) {
    if (key in data2) {
      const val1 = JSON.stringify(data1[key]);
      const val2 = JSON.stringify(data2[key]);
      if (val1 !== val2) {
        modified[key] = { old: data1[key], new: data2[key] };
      }
    }
  }
  
  return { added, removed, modified };
}

/**
 * HJSON 工具类 - 提供面向对象的 API
 */
export class HJSON {
  private data: NodeValue;
  
  constructor(data?: NodeValue) {
    this.data = data ?? {};
  }
  
  /**
   * 从字符串解析
   */
  static async parse(text: string, options?: HJSONParseOptions): Promise<HJSON> {
    const data = await parse(text, options);
    return new HJSON(data);
  }
  
  /**
   * 从字符串解析（同步）
   */
  static parseSync(text: string, options?: HJSONParseOptions): HJSON {
    const data = parseSync(text, options);
    return new HJSON(data);
  }
  
  /**
   * 从文件加载
   */
  static async load(filepath: string, options?: HJSONParseOptions): Promise<HJSON> {
    const data = await load(filepath, options);
    return new HJSON(data);
  }
  
  /**
   * 从文件加载（同步）
   */
  static loadSync(filepath: string, options?: HJSONParseOptions): HJSON {
    const data = loadSync(filepath, options);
    return new HJSON(data);
  }
  
  /**
   * 获取数据
   */
  get(): NodeValue {
    return this.data;
  }
  
  /**
   * 设置数据
   */
  set(data: NodeValue): this {
    this.data = data;
    return this;
  }
  
  /**
   * 获取路径值
   */
  getPath(path: string): NodeValue | undefined {
    const parts = path.split('.');
    let current: NodeValue = this.data;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      if (Array.isArray(current)) {
        const index = parseInt(part, 10);
        current = current[index];
      } else if (typeof current === 'object') {
        current = (current as Record<string, NodeValue>)[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
  
  /**
   * 设置路径值
   */
  setPath(path: string, value: NodeValue): this {
    const parts = path.split('.');
    let current: NodeValue = this.data;
    
    if (typeof current !== 'object' || current === null) {
      this.data = {};
      current = this.data;
    }
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextNumber = /^\d+$/.test(nextPart);
      
      if (Array.isArray(current)) {
        const index = parseInt(part, 10);
        if (current[index] === undefined || typeof current[index] !== 'object') {
          current[index] = isNextNumber ? [] : {};
        }
        current = current[index];
      } else {
        if ((current as Record<string, NodeValue>)[part] === undefined || 
            typeof (current as Record<string, NodeValue>)[part] !== 'object') {
          (current as Record<string, NodeValue>)[part] = isNextNumber ? [] : {};
        }
        current = (current as Record<string, NodeValue>)[part];
      }
    }
    
    const lastPart = parts[parts.length - 1];
    if (Array.isArray(current)) {
      current[parseInt(lastPart, 10)] = value;
    } else {
      (current as Record<string, NodeValue>)[lastPart] = value;
    }
    
    return this;
  }
  
  /**
   * 序列化为 HJSON
   */
  async stringify(options?: HJSONStringifyOptions): Promise<string> {
    return stringify(this.data, options);
  }
  
  /**
   * 序列化为 HJSON（同步）
   */
  stringifySync(options?: HJSONStringifyOptions): string {
    return stringifySync(this.data, options);
  }
  
  /**
   * 序列化为 JSON
   */
  toJSON(space?: string | number): string {
    return JSON.stringify(this.data, null, space ?? 2);
  }
  
  /**
   * 转换为对象
   */
  toObject(): NodeValue {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  /**
   * 保存到文件
   */
  async save(filepath: string, options?: HJSONStringifyOptions): Promise<void> {
    return save(filepath, this.data, options);
  }
  
  /**
   * 保存到文件（同步）
   */
  saveSync(filepath: string, options?: HJSONStringifyOptions): void {
    return saveSync(filepath, this.data, options);
  }
  
  /**
   * 克隆
   */
  clone(): HJSON {
    return new HJSON(this.toObject());
  }
  
  /**
   * 合并其他数据
   */
  merge(...others: NodeValue[]): this {
    for (const other of others) {
      if (typeof other === 'object' && other !== null && !Array.isArray(other) &&
          typeof this.data === 'object' && this.data !== null && !Array.isArray(this.data)) {
        this.data = { ...this.data, ...other };
      }
    }
    return this;
  }
}

export default {
  parse,
  parseSync,
  parseSafe,
  stringify,
  stringifySync,
  format,
  minify,
  minifySync,
  convertJSONtoHJSON,
  convertHJSONtoJSON,
  isHJSON,
  isJSON,
  detectFormat,
  load,
  loadSync,
  save,
  saveSync,
  merge,
  diff,
  HJSON
};
