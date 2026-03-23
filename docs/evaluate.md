# Evaluate

`evaluate` and `evaluateSafe` are the highest-level entry points. They parse an
expression string (if needed) and execute it in a single call.

## Function signatures

```ts
function evaluate(
  expression: string | LogicalExpression,
  options?: EvaluateOptions,
): unknown;

function evaluateSafe(
  expression: string | LogicalExpression,
  options?: EvaluateOptions,
): { type: "success"; result: unknown } | { type: "error"; error: ESCalcError };
```

## Options

| Option             | Type                              | Description                                                                              |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `params`           | `Map<string, unknown>`            | Named parameter values. Keys match parameter names in the expression (without brackets). |
| `lazyParams`       | `Map<string, () => unknown>`      | Parameters computed on demand when first accessed.                                       |
| `functions`        | `Map<string, ExpressionFunction>` | Custom functions callable by name from the expression.                                   |
| `calculator`       | `Calculator`                      | Override how operators are evaluated. Defaults to `StandardCalculator`.                  |
| `stopOnFirstError` | `boolean`                         | Stop parsing on the first error (default: `true`).                                       |

## Examples

### Basic arithmetic

```ts
import { evaluate } from "@imogenz/escalc";

evaluate("(3 + 4) * 2"); // => 14
```

### Parameters

```ts
evaluate("[unitPrice] * [qty]", {
  params: new Map([
    ["unitPrice", 9.99],
    ["qty", 3],
  ]),
}); // => 29.97
```

### Lazy parameters

Use `lazyParams` when a parameter value is expensive to compute and may not be
needed (e.g. when the expression short-circuits):

```ts
evaluate("[flag] || [expensiveValue]", {
  params: new Map([["flag", true]]),
  lazyParams: new Map([["expensiveValue", () => computeExpensiveValue()]]),
}); // expensiveValue is never called because flag is true
```

### Custom functions

```ts
evaluate("double([x])", {
  params: new Map([["x", 5]]),
  functions: new Map([
    ["double", (args) => (args[0].evaluate() as number) * 2],
  ]),
}); // => 10
```

### Passing a pre-parsed AST

If you have already called `parse()` you can pass the `LogicalExpression` directly
to skip the parse step:

```ts
import { parse, evaluate } from "@imogenz/escalc";

const ast = parse("[x] + 1");
evaluate(ast, { params: new Map([["x", 10]]) }); // => 11
```

### Safe usage

```ts
import { evaluateSafe } from "@imogenz/escalc";

const result = evaluateSafe("1 / [y]", { params: new Map([["y", 0]]) });
if (result.type === "error") {
  // handle gracefully
}
```

## Errors

| Error class   | When thrown                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| `ParserError` | The expression string is syntactically invalid.                                     |
| `ESCalcError` | A runtime error: unknown parameter, unsupported type combination, unknown function. |

`evaluateSafe` catches all `ESCalcError` subclasses. Other exceptions propagate normally.
