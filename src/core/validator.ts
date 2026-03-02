/**
 * JSON Schema 验证器
 * 基于 AJV 的验证功能封装
 */

import type { NodeValue, ValidationResult, ValidationError, ValidationOptions } from '../types';

// 动态导入 AJV，避免在不需要验证时的依赖
let AJV: typeof import('ajv').default | null = null;
let ajvInstance: import('ajv').default | null = null;

async function getAjv(): Promise<typeof import('ajv').default> {
  if (!AJV) {
    const module = await import('ajv');
    AJV = module.default;
  }
  return AJV!;
}

async function getAjvInstance(options?: ValidationOptions): Promise<import('ajv').default> {
  if (!ajvInstance) {
    const AjvClass = await getAjv();
    ajvInstance = new AjvClass({
      strict: options?.strict ?? false,
      allErrors: options?.allErrors ?? true,
      useDefaults: options?.useDefaults ?? true,
      coerceTypes: options?.coerceTypes ?? true
    });
  }
  return ajvInstance;
}

/**
 * 验证数据是否符合 JSON Schema
 * @param data 要验证的数据
 * @param schema JSON Schema
 * @param options 验证选项
 * @returns 验证结果
 */
export async function validate(
  data: NodeValue,
  schema: unknown,
  options?: ValidationOptions
): Promise<ValidationResult> {
  try {
    const ajv = await getAjvInstance(options);
    const validateFn = ajv.compile(schema as object);
    const valid = validateFn(data);
    
    if (valid) {
      return { valid: true };
    }
    
    const errors: ValidationError[] = (validateFn.errors || []).map(err => ({
      message: err.message || 'Unknown error',
      path: err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : '',
      value: err.params ? Object.values(err.params)[0] : undefined,
      schemaPath: err.schemaPath
    }));
    
    return { valid: false, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        message: error instanceof Error ? error.message : 'Validation error',
        path: '',
        value: data
      }]
    };
  }
}

/**
 * 同步验证（如果 AJV 已加载）
 * @param data 要验证的数据
 * @param schema JSON Schema
 * @param options 验证选项
 * @returns 验证结果
 */
export function validateSync(
  data: NodeValue,
  schema: unknown,
  options?: ValidationOptions
): ValidationResult {
  // 如果没有 AJV，返回简单的类型检查
  if (!ajvInstance) {
    return validateBasic(data, schema);
  }
  
  try {
    const validateFn = ajvInstance.compile(schema as object);
    const valid = validateFn(data);
    
    if (valid) {
      return { valid: true };
    }
    
    const errors: ValidationError[] = (validateFn.errors || []).map(err => ({
      message: err.message || 'Unknown error',
      path: err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : '',
      value: err.params ? Object.values(err.params)[0] : undefined,
      schemaPath: err.schemaPath
    }));
    
    return { valid: false, errors };
  } catch (error) {
    return {
      valid: false,
      errors: [{
        message: error instanceof Error ? error.message : 'Validation error',
        path: '',
        value: data
      }]
    };
  }
}

/**
 * 基本验证（不依赖 AJV）
 * @param data 要验证的数据
 * @param schema 简化的 schema
 * @returns 验证结果
 */
function validateBasic(data: NodeValue, schema: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof schema !== 'object' || schema === null) {
    return { valid: true };
  }
  
  const schemaObj = schema as Record<string, unknown>;
  
  // 类型检查
  if (schemaObj.type) {
    const type = schemaObj.type as string;
    const dataType = Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;
    
    if (type !== dataType) {
      errors.push({
        message: `Expected type '${type}', got '${dataType}'`,
        path: '',
        value: data
      });
    }
  }
  
  // 必需字段检查
  if (Array.isArray(schemaObj.required) && typeof data === 'object' && data !== null) {
    for (const field of schemaObj.required) {
      if (!(field in data)) {
        errors.push({
          message: `Missing required field: ${field}`,
          path: String(field),
          value: undefined
        });
      }
    }
  }
  
  // 属性检查
  if (schemaObj.properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const dataObj = data as Record<string, NodeValue>;
    const props = schemaObj.properties as Record<string, unknown>;
    
    for (const [key, propSchema] of Object.entries(props)) {
      if (key in dataObj) {
        const propResult = validateBasic(dataObj[key], propSchema);
        if (!propResult.valid && propResult.errors) {
          errors.push(...propResult.errors.map(e => ({
            ...e,
            path: e.path ? `${key}.${e.path}` : key
          })));
        }
      }
    }
  }
  
  // 数组项检查
  if (schemaObj.items && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const itemResult = validateBasic(data[i], schemaObj.items);
      if (!itemResult.valid && itemResult.errors) {
        errors.push(...itemResult.errors.map(e => ({
          ...e,
          path: e.path ? `[${i}].${e.path}` : `[${i}]`
        })));
      }
    }
  }
  
  // 枚举检查
  if (Array.isArray(schemaObj.enum)) {
    if (!schemaObj.enum.includes(data)) {
      errors.push({
        message: `Value must be one of: ${schemaObj.enum.join(', ')}`,
        path: '',
        value: data
      });
    }
  }
  
  // 最小值/最大值检查
  if (typeof data === 'number') {
    if (typeof schemaObj.minimum === 'number' && data < schemaObj.minimum) {
      errors.push({
        message: `Value must be >= ${schemaObj.minimum}`,
        path: '',
        value: data
      });
    }
    if (typeof schemaObj.maximum === 'number' && data > schemaObj.maximum) {
      errors.push({
        message: `Value must be <= ${schemaObj.maximum}`,
        path: '',
        value: data
      });
    }
  }
  
  // 字符串长度检查
  if (typeof data === 'string') {
    if (typeof schemaObj.minLength === 'number' && data.length < schemaObj.minLength) {
      errors.push({
        message: `String length must be >= ${schemaObj.minLength}`,
        path: '',
        value: data
      });
    }
    if (typeof schemaObj.maxLength === 'number' && data.length > schemaObj.maxLength) {
      errors.push({
        message: `String length must be <= ${schemaObj.maxLength}`,
        path: '',
        value: data
      });
    }
    if (schemaObj.pattern) {
      const regex = new RegExp(schemaObj.pattern as string);
      if (!regex.test(data)) {
        errors.push({
          message: `String does not match pattern: ${schemaObj.pattern}`,
          path: '',
          value: data
        });
      }
    }
  }
  
  // 数组长度检查
  if (Array.isArray(data)) {
    if (typeof schemaObj.minItems === 'number' && data.length < schemaObj.minItems) {
      errors.push({
        message: `Array must have at least ${schemaObj.minItems} items`,
        path: '',
        value: data
      });
    }
    if (typeof schemaObj.maxItems === 'number' && data.length > schemaObj.maxItems) {
      errors.push({
        message: `Array must have at most ${schemaObj.maxItems} items`,
        path: '',
        value: data
      });
    }
  }
  
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * 创建预编译的验证器
 * @param schema JSON Schema
 * @param options 验证选项
 * @returns 验证函数
 */
export async function createValidator(
  schema: unknown,
  options?: ValidationOptions
): Promise<(data: NodeValue) => ValidationResult> {
  const ajv = await getAjvInstance(options);
  const validateFn = ajv.compile(schema as object);
  
  return (data: NodeValue): ValidationResult => {
    const valid = validateFn(data);
    
    if (valid) {
      return { valid: true };
    }
    
    const errors: ValidationError[] = (validateFn.errors || []).map(err => ({
      message: err.message || 'Unknown error',
      path: err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : '',
      value: err.params ? Object.values(err.params)[0] : undefined,
      schemaPath: err.schemaPath
    }));
    
    return { valid: false, errors };
  };
}

/**
 * 验证并抛出错误
 * @param data 要验证的数据
 * @param schema JSON Schema
 * @param options 验证选项
 * @throws 验证失败时抛出错误
 */
export async function validateOrThrow(
  data: NodeValue,
  schema: unknown,
  options?: ValidationOptions
): Promise<void> {
  const result = await validate(data, schema, options);
  if (!result.valid) {
    const messages = result.errors?.map(e => `${e.path}: ${e.message}`).join('\n') || 'Validation failed';
    throw new Error(`Validation failed:\n${messages}`);
  }
}

/**
 * 验证数组中的每一项
 * @param data 数组数据
 * @param schema JSON Schema
 * @param options 验证选项
 * @returns 验证结果，包含每个元素的验证状态
 */
export async function validateArray(
  data: NodeValue[],
  schema: unknown,
  options?: ValidationOptions
): Promise<{ index: number; result: ValidationResult }[]> {
  const results: { index: number; result: ValidationResult }[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const result = await validate(data[i], schema, options);
    results.push({ index: i, result });
  }
  
  return results;
}

/**
 * 获取 Schema 的默认数据
 * @param schema JSON Schema
 * @returns 包含默认值的对象
 */
export function getDefaults(schema: unknown): NodeValue {
  if (typeof schema !== 'object' || schema === null) {
    return undefined;
  }
  
  const schemaObj = schema as Record<string, unknown>;
  
  // 如果有 default，直接返回
  if ('default' in schemaObj) {
    return schemaObj.default as NodeValue;
  }
  
  // 对象类型
  if (schemaObj.type === 'object' && schemaObj.properties) {
    const result: Record<string, NodeValue> = {};
    const props = schemaObj.properties as Record<string, unknown>;
    
    for (const [key, propSchema] of Object.entries(props)) {
      const defaultValue = getDefaults(propSchema);
      if (defaultValue !== undefined) {
        result[key] = defaultValue;
      }
    }
    
    return result;
  }
  
  // 数组类型
  if (schemaObj.type === 'array') {
    if (schemaObj.default && Array.isArray(schemaObj.default)) {
      return schemaObj.default;
    }
    return [];
  }
  
  // 基本类型默认值
  switch (schemaObj.type) {
    case 'string': return '';
    case 'number':
    case 'integer': return 0;
    case 'boolean': return false;
    case 'null': return null;
    default: return undefined;
  }
}

/**
 * 验证器类 - 提供面向对象的 API
 */
export class Validator {
  private schemas: Map<string, unknown> = new Map();
  private validators: Map<string, (data: NodeValue) => ValidationResult> = new Map();
  
  /**
   * 注册 Schema
   * @param name Schema 名称
   * @param schema JSON Schema
   */
  register(name: string, schema: unknown): this {
    this.schemas.set(name, schema);
    this.validators.delete(name); // 清除缓存的验证器
    return this;
  }
  
  /**
   * 验证数据
   * @param name 注册的 Schema 名称
   * @param data 要验证的数据
   */
  async validate(name: string, data: NodeValue): Promise<ValidationResult> {
    const schema = this.schemas.get(name);
    if (!schema) {
      return {
        valid: false,
        errors: [{ message: `Schema '${name}' not found`, path: '', value: undefined }]
      };
    }
    
    return validate(data, schema);
  }
  
  /**
   * 验证数据（同步）
   * @param name 注册的 Schema 名称
   * @param data 要验证的数据
   */
  validateSync(name: string, data: NodeValue): ValidationResult {
    const schema = this.schemas.get(name);
    if (!schema) {
      return {
        valid: false,
        errors: [{ message: `Schema '${name}' not found`, path: '', value: undefined }]
      };
    }
    
    return validateSync(data, schema);
  }
  
  /**
   * 获取 Schema 的默认值
   * @param name Schema 名称
   */
  getDefaults(name: string): NodeValue {
    const schema = this.schemas.get(name);
    if (!schema) {
      return undefined;
    }
    
    return getDefaults(schema);
  }
  
  /**
   * 获取已注册的 Schema 名称列表
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }
  
  /**
   * 检查 Schema 是否已注册
   * @param name Schema 名称
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }
  
  /**
   * 移除注册的 Schema
   * @param name Schema 名称
   */
  unregister(name: string): this {
    this.schemas.delete(name);
    this.validators.delete(name);
    return this;
  }
  
  /**
   * 清除所有注册的 Schema
   */
  clear(): this {
    this.schemas.clear();
    this.validators.clear();
    return this;
  }
}

export default {
  validate,
  validateSync,
  validateBasic,
  createValidator,
  validateOrThrow,
  validateArray,
  getDefaults,
  Validator
};
