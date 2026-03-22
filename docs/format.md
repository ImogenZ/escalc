# Format

`format` and `formatSafe` serialize a `LogicalExpression` (or expression string)
back to a canonical string.

## Function signatures

```ts
function format(expression: string | LogicalExpression): string;

function formatSafe(
  expression: string | LogicalExpression,
): { type: "success"; result: string } | { type: "error"; error: ESCalcError };
```

## Canonical output rules

| Input syntax                | Formatted output                            |
| --------------------------- | ------------------------------------------- |
| `[name]`, `{name}`          | `[name]`                                    |
| Bare string literal         | `'value'`                                   |
| Number / boolean literal    | Unchanged                                   |
| Date literal `#YYYY-MM-DD#` | `#YYYY-MM-DD#`                              |
| Binary operators            | Surrounded by single spaces: `a + b`        |
| Ternary                     | `condition ? trueValue : falseValue`        |
| `in` / `not in`             | `left in right`, `left not in right`        |
| Lists                       | Items joined by commas (no spaces): `1,2,3` |

`format` does **not** add parentheses to disambiguate precedence; the output
preserves the operator precedence implied by the AST structure.

## Examples

```ts
import { format } from "escalc";

// Normalise whitespace
format("1+2"); // => '1 + 2'
format("  [x]  *  3"); // => '[x] * 3'

// Parameter bracket style normalisation
format("{myParam} + 1"); // => '[myParam] + 1'

// Round-trip: parse then format gives normalised form
format("[price]*(1+[tax])"); // => '[price] * 1 + [tax]'
```

## Round-trip normaliser

Combine `parse` and `format` to normalise any expression to a canonical form before
storing or displaying it:

```ts
import { format } from "escalc";

function normalise(expr: string): string {
  return format(expr);
}

normalise("  ( [x]+[y] ) * 2 "); // => '[x] + [y] * 2'
```

## Safe usage

```ts
import { formatSafe } from "escalc";

const result = formatSafe(userInput);
if (result.type === "error") {
  console.error("Invalid expression:", result.error.message);
} else {
  console.log(result.result);
}
```
