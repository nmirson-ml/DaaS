import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
    }),
  ],
  external: ['react', 'react-dom'],
};

const configs = [];

// ESM build
configs.push({
  ...baseConfig,
  output: {
    file: 'dist/esm/index.js',
    format: 'es',
    sourcemap: true,
  },
});

// CJS build
configs.push({
  ...baseConfig,
  output: {
    file: 'dist/cjs/index.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
  },
});

// UMD build for browsers
configs.push({
  ...baseConfig,
  external: [], // No externals for browser build
  output: {
    file: isProduction ? 'dist/browser/embedded-dashboard.min.js' : 'dist/browser/embedded-dashboard.js',
    format: 'umd',
    name: 'EmbeddedDashboard',
    sourcemap: true,
    globals: {},
  },
  plugins: [
    ...baseConfig.plugins,
    ...(isProduction ? [terser()] : []),
  ],
});

export default configs;