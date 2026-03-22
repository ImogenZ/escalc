# Parameters

`parameters` extracts every parameter reference and non-built-in function call
present in an expression.

## Function signatures

```ts
function parameters(expression: string | LogicalExpression): {
  names: Set<string>;
  functions: Set<string>;
};
```

## Return value

| Field       | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| `names`     | Distinct parameter names (without brackets), in first-encounter order. |
| `functions` | Distinct non-built-in function names, in first-encounter order.        |

Built-in functions (`Abs`, `Sin`, `if`, `ifs`, etc.) are **excluded** from
`functions` because they are always available without configuration.

## Examples

### Extract parameter names

```ts
import { parameters } from "escalc";

parameters("[price] * (1 + [taxRate]) - [discount]");
// => { names: Set { 'price', 'taxRate', 'discount' }, functions: Set {} }
```

### Identify custom functions

```ts
parameters("myFn([x]) + Abs([x]) + anotherFn([y])");
// => { names: Set { 'x', 'y' }, functions: Set { 'myFn', 'anotherFn' } }
// Abs is built-in, so it is not included in functions
```

### Validate that all parameters are supplied

```ts
import { parameters, evaluate } from "escalc";

function safeEvaluate(expr: string, values: Record<string, unknown>) {
  const { names } = parameters(expr);
  const missing = [...names].filter((n) => !(n in values));
  if (missing.length) {
    throw new Error(`Missing parameters: ${missing.join(", ")}`);
  }
  return evaluate(expr, { params: new Map(Object.entries(values)) });
}
```

### Handling invalid expressions

```ts
import { parameters } from "escalc";

try {
  const result = parameters(userInput);
  console.log("Parameters:", [...result.names]);
} catch (error) {
  console.error("Expression is invalid", error);
}
```
