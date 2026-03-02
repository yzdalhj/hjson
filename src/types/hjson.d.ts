/**
 * HJSON 模块类型声明
 */

declare module 'hjson' {
  export interface HJSONParseOptions {
    keepWsc?: boolean;
    legacyRoot?: boolean;
  }

  export interface HJSONStringifyOptions {
    bracesSameLine?: boolean;
    keepWsc?: boolean;
    quotes?: 'min' | 'keys' | 'all' | 'strings';
    condense?: number;
    emitRootBraces?: boolean;
    separator?: boolean;
    space?: string | number;
    eol?: string;
    colors?: boolean;
  }

  /**
   * 解析 HJSON 字符串
   */
  export function parse(text: string, options?: HJSONParseOptions): unknown;

  /**
   * 将对象序列化为 HJSON 字符串
   */
  export function stringify(value: unknown, options?: HJSONStringifyOptions): string;

  /**
   * HJSON 对象
   */
  const hjson: {
    parse: typeof parse;
    stringify: typeof stringify;
  };

  export default hjson;
}
