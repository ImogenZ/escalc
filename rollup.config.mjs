import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

/** @type {import('rollup').RollupOptions} */
export default {
  input: ["./src/index.ts"],
  output: {
    dir: "dist",
    format: "esm",
    sourcemap: true,
  },
  plugins: [
    terser(),
    typescript({ tsconfig: "./tsconfig.lib.json", outputToFilesystem: true }),
  ],
};
