import {defineConfig} from 'tsup'

export default defineConfig([
  {
    entry: {index: "src/index.ts"},
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
  },
  {
    entry: {unique_schemas: "src/index.ts"},
    format: ["iife"],
    globalName: "UniqueSchemas",
    minify: true,
    sourcemap: true,
    noExternal: [/.*/],
    outExtension: ({format}) => ({js: `.min.js`}),
  },
])
