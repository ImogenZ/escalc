# Getting Started

## Installation

```bash
npm install @imogenz/escalc
# or
pnpm add @imogenz/escalc
# or
yarn add @imogenz/escalc
```

## Your first expression

```ts
import { evaluate } from "@imogenz/escalc";

evaluate("1 + 2"); // => 3
evaluate("10 % 3"); // => 1
evaluate("2 ** 8"); // => 256
evaluate("true && false"); // => false
```

## Passing parameters

Parameters are referenced in expressions using `[name]` or `{name}` syntax.
Supply their values via the `params` option:

```ts
import { evaluate } from "@imogenz/escalc";

evaluate("[price] * (1 + [taxRate])", {
  params: new Map([
    ["price", 100],
    ["taxRate", 0.2],
  ]),
}); // => 120
```

## Using built-in functions

ESCalc ships with a full set of NCalc-compatible mathematical functions and
two conditional helpers:

```ts
evaluate("Max(Abs(-5), Sqrt(16))"); // => 5  (Abs wins: 5 > 4)
evaluate("Round(3.14159, 2)"); // => 3.14
evaluate('if(true, "yes", "no")'); // => 'yes'
```

See [Supported Features](./supported-features.md) for the full list.

## Safe variants

Every top-level function has a `*Safe` counterpart that returns a discriminated
union `{ type: 'success', result }` or `{ type: 'error', error }` instead of
throwing. Use these when you cannot guarantee the expression is valid:

```ts
import { evaluateSafe } from "@imogenz/escalc";

const result = evaluateSafe("[x] + 1", { params: new Map([["x", 5]]) });

if (result.type === "success") {
  console.log(result.result); // 6
} else {
  console.error(result.error.message);
}
```
