# escalc

![npm](https://img.shields.io/npm/v/escalc)
![Downloads](https://img.shields.io/npm/dw/escalc)

<img src="escalc.png" alt="ESCalc logo" width="120" />

escalc is an opinionated [NCalc](https://github.com/ncalc/ncalc) expression evaluator in TypeScript.
It exposes a parser, a tree-walk evaluator, a formatter, and a parameter extractor for a well-defined
subset of the NCalc expression language.

Designed for a small footprint and fast execution with **zero dependencies**.

## Install

```bash
npm install escalc
# or
pnpm add escalc
# or
yarn add escalc
```

## Quick start

```ts
import { evaluate } from "@imogenz/escalc";

// Basic arithmetic
evaluate("1 + 2"); // => 3
evaluate("2 ** 8"); // => 256
evaluate("Max(Abs(-5), 2)"); // => 5

// Parameters
evaluate("[price] * (1 + [tax])", {
  params: new Map([
    ["price", 100],
    ["tax", 0.2],
  ]),
}); // => 120

// Safe variant - no throwing
import { evaluateSafe } from "@imogenz/escalc";
const result = evaluateSafe(userInput);
if (result.type === "success") console.log(result.result);
```

## Demos

See the [Demos](./docs/demo.md) guide for complete real-world examples.

## See also

- [Getting Started](./docs/getting-started.md)
- [TypeScript API reference](./docs/types.md)

## Implementation

Created using a recursive descent parser with a handwritten lexer and tree-walk evaluator.
The parser supports error recovery: with `stopOnFirstError: false` it collects all
recoverable errors and returns a partial AST via `incompleteExpression`.

## Support matrix

| Feature                                          | Status                                  |
| ------------------------------------------------ | --------------------------------------- |
| Arithmetic (`+` `-` `*` `/` `%` `**`)            | ✅                                      |
| Comparison (`>` `<` `>=` `<=` `==` `!=`)         | ✅                                      |
| Logical (`&&` `\|\|` `!`) with short-circuit     | ✅                                      |
| Bitwise (`&` `\|` `^` `<<` `>>` `~`)             | ✅                                      |
| Ternary (`? :`)                                  | ✅                                      |
| `in` / `not in`                                  | ✅                                      |
| String / number / boolean / date / list literals | ✅                                      |
| Parameter references (`[name]`, `{name}`)        | ✅                                      |
| Built-in math functions (Abs, Sin, Sqrt, …)      | ✅                                      |
| `if` / `ifs` conditional functions               | ✅                                      |
| Custom functions                                 | ✅                                      |
| Lazy parameters                                  | ✅                                      |
| Custom operator implementation (`Calculator`)    | ✅                                      |
| Result caching                                   | ❌ won't implement - cache at call site |
| GUID value type                                  | ❌ won't implement - use a string       |

See [Supported Features](./docs/supported-features.md) for the full reference.

## Equivalent NCalc flags

| NCalc flag                          | ESCalc equivalent                                  |
| ----------------------------------- | -------------------------------------------------- |
| `EvaluateOptions.IterateParameters` | Not supported                                      |
| `EvaluateOptions.IgnoreCase`        | Not supported - parameter names are case-sensitive |
| `EvaluateOptions.NoCache`           | Default behaviour (no caching)                     |
| `EvaluateOptions.RoundAwayFromZero` | Override `Calculator.modulus` / `Round`            |
| Custom function handler             | `functions` option in `evaluate` / `execute`       |
| Custom value factory                | Extend `StandardCalculator`                        |

## How to extend behaviour

Override the provided `Calculator` interface or extend `StandardCalculator` to
change how operators work. Extend `AbstractVisitor<T>` for custom AST traversal.

See [Overriding Evaluation](./docs/overriding-evaluation.md) for examples.

## License

[MIT](./LICENSE) License © 2026 [ImogenZ](https://github.com/ImogenZ)
