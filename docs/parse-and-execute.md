# Parse & Execute

For most use cases `evaluate` is the right choice. Use `parse` + `execute`
separately when you need to:

- **Validate** an expression before running it (e.g. in an editor or form).
- **Reuse an AST** across multiple evaluate calls with different parameters.
- **Inspect the AST** programmatically (walk the tree, extract information).

## Parsing

```ts
import { parse, parseSafe } from "escalc";

// Throws ParserError on syntax errors
const ast = parse("[price] * (1 + [tax])");

// Returns a discriminated union instead of throwing
const result = parseSafe("[price] * (1 + [tax])");
if (result.type === "success") {
  const ast = result.expression;
}
```

### Parser options

| Option             | Type      | Default | Description                                                                                                                                                        |
| ------------------ | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stopOnFirstError` | `boolean` | `true`  | When `false`, the parser attempts to recover and continue past errors. The `ParserError` will have an `incompleteExpression` AST built up to the point of failure. |

### Partial error recovery

With `stopOnFirstError: false` the parser collects all errors it can recover from
and attaches the partial AST as `incompleteExpression`:

```ts
import { parseSafe } from "escalc";

const result = parseSafe("1 + + 2", { stopOnFirstError: false });
if (result.type === "error") {
  console.log(result.error.errors.length); // number of issues
  console.log(result.error.errors[0].detailedMessage);
  const partialAst = result.error.incompleteExpression; // may be non-null
}
```

## Executing

```ts
import { execute, executeSafe } from "escalc";

const ast = parse("[x] ** 2");

// Execute with different parameter sets without re-parsing
execute(ast, { params: new Map([["x", 3]]) }); // => 9
execute(ast, { params: new Map([["x", 4]]) }); // => 16
```

`execute` accepts the same options as `evaluate`:

| Option       | Type                              | Description                     |
| ------------ | --------------------------------- | ------------------------------- |
| `params`     | `Map<string, unknown>`            | Named parameter values.         |
| `lazyParams` | `Map<string, () => unknown>`      | On-demand parameters.           |
| `functions`  | `Map<string, ExpressionFunction>` | Custom functions.               |
| `calculator` | `Calculator`                      | Custom operator implementation. |

## Parse once, run many times

```ts
import { parse, execute } from "escalc";

const formula = parse("[base] + [bonus] * [multiplier]");

const employees = [
  { base: 50000, bonus: 5000, multiplier: 1.1 },
  { base: 60000, bonus: 8000, multiplier: 1.2 },
];

const results = employees.map(({ base, bonus, multiplier }) =>
  execute(formula, {
    params: new Map([
      ["base", base],
      ["bonus", bonus],
      ["multiplier", multiplier],
    ]),
  }),
);
// => [55500, 69600]
```

## AST node types

The `LogicalExpression` type is a discriminated union. Every node has a `type`
property you can switch on:

```ts
import { parse, type LogicalExpression } from "escalc";

function countNodes(expr: LogicalExpression): number {
  switch (expr.type) {
    case "value":
      return 1;
    case "unary":
      return 1 + countNodes(expr.expression);
    case "binary":
      return 1 + countNodes(expr.left) + countNodes(expr.right);
    case "ternary":
      return (
        1 +
        countNodes(expr.left) +
        countNodes(expr.middle) +
        countNodes(expr.right)
      );
    case "function":
      return 1 + expr.arguments.reduce((n, a) => n + countNodes(a), 0);
  }
}
```

Each node also carries a `location: SourceRegion | null` with character offset,
line, and column information.
