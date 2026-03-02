import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const external = ['ajv', 'hjson', 'path', 'fs', 'fs/promises', 'node:fs', 'node:fs/promises'];

export default [
  // 主入口 - ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  },
  // 主入口 - CJS
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true
    },
    external,
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  },
  // 异步模块 - ESM
  {
    input: 'src/async.ts',
    output: {
      file: 'dist/async.mjs',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  },
  // 异步模块 - CJS
  {
    input: 'src/async.ts',
    output: {
      file: 'dist/async.cjs',
      format: 'cjs',
      sourcemap: true
    },
    external,
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  }
];
