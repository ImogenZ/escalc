# Overriding Evaluation

ESCalc is designed to be extensible. You can change how operators are evaluated,
add custom functions, provide on-demand parameters, or traverse the AST yourself.

## Custom functions

Register functions as a `Map<string, ExpressionFunction>` and
pass them via the `functions` option:

```ts
import { evaluate, type ExpressionFunction } from "escalc";

const repeat: ExpressionFunction = (args) => {
  const str = args[0].evaluate() as string;
  const n = args[1].evaluate() as number;
  return str.repeat(n);
};

evaluate("repeat([word], 3)", {
  params: new Map([["word", "hi"]]),
  functions: new Map([["repeat", repeat]]),
}); // => 'hihihi'
```

Each argument is a `FunctionArgument`:

```ts
type FunctionArgument = {
  expression: LogicalExpression; // raw AST node
  evaluate: () => unknown; // call to get the value
};
```

Call `evaluate()` only when you need the value - this enables short-circuit logic:

```ts
const ifElse: ExpressionFunction = (args) => {
  const condition = args[0].evaluate() as boolean;
  return condition ? args[1].evaluate() : args[2].evaluate();
  //                 ^ evaluated lazily  ^ never called if condition is true
};
```

---

## Lazy parameters

Supply parameters that should only be computed when accessed using `lazyParams`:

```ts
import { evaluate } from "escalc";

evaluate("[useCache] || [fetchData]", {
  params: new Map([["useCache", true]]),
  lazyParams: new Map([["fetchData", () => expensiveFetch()]]),
}); // expensiveFetch() is never called - short-circuit evaluation skips it
```

---

## Custom Calculator

The `Calculator` interface controls how every binary, unary, and ternary operator
is evaluated. Implementing it lets you change operator semantics completely.

### Extending StandardCalculator (partial override)

The easiest approach is to extend `StandardCalculator` and override only the
methods you want to change:

```ts
import { StandardCalculator, type CalculatorArgument } from "escalc";

/** A calculator that concatenates strings with + as well as adding numbers. */
class StringAwareCalculator extends StandardCalculator {
  override add(left: CalculatorArgument, right: CalculatorArgument): unknown {
    const l = left.evaluate();
    const r = right.evaluate();
    if (typeof l === "string" || typeof r === "string") {
      return String(l) + String(r);
    }
    return super.add(left, right);
  }
}

import { evaluate } from "escalc";

evaluate('"Hello, " + [name]', {
  params: new Map([["name", "world"]]),
  calculator: new StringAwareCalculator(),
}); // => 'Hello, world'
```

### Implementing Calculator from scratch

Implement the full `Calculator` interface when you need complete control:

```ts
import { type Calculator, type CalculatorArgument } from "escalc";

class MyCalculator implements Calculator {
  add(left: CalculatorArgument, right: CalculatorArgument): unknown {
    return (left.evaluate() as number) + (right.evaluate() as number);
  }
  // ... implement all other methods
}
```

---

## Custom AST traversal with AbstractVisitor

Extend `AbstractVisitor<T>` to walk the AST and produce any value of type `T`.
This is how `StandardEvaluator` itself, the formatter, and the parameter extractor are built internally.

```ts
import {
  AbstractVisitor,
  parse,
  type BinaryExpression,
  type UnaryExpression,
  type ValueExpression,
  type FunctionExpression,
  type TernaryExpression,
} from "escalc";

/** Count the number of parameter references in an expression. */
class ParameterCounter extends AbstractVisitor<number> {
  ternary(expr: TernaryExpression): number {
    return (
      this.logical(expr.left) +
      this.logical(expr.middle) +
      this.logical(expr.right)
    );
  }
  binary(expr: BinaryExpression): number {
    return this.logical(expr.left) + this.logical(expr.right);
  }
  unary(expr: UnaryExpression): number {
    return this.logical(expr.expression);
  }
  value(expr: ValueExpression): number {
    return expr.value.type === "parameter" ? 1 : 0;
  }
  function(expr: FunctionExpression): number {
    return expr.arguments.reduce((sum, arg) => sum + this.logical(arg), 0);
  }
}

const ast = parse("[a] + [b] * [a]");
const counter = new ParameterCounter();
counter.logical(ast); // => 3  (a appears twice, b once)
```

---

## Using StandardEvaluator directly

For advanced scenarios you can construct `StandardEvaluator` manually:

```ts
import { parse, StandardEvaluator, StandardCalculator } from "escalc";

const evaluator = new StandardEvaluator({
  params: new Map([["x", 10]]),
  lazyParams: new Map(),
  functions: new Map(),
  calculator: new StandardCalculator(),
});

evaluator.logical(parse("[x] ** 2")); // => 100
```

---

## Decimal.js Integration

By default ESCalc uses JavaScript's native `number` type for all arithmetic,
which is a 64-bit IEEE 754 double-precision float. This is sufficient for most
use cases, but produces the familiar floating-point rounding surprises:

```ts
evaluate("0.1 + 0.2"); // => 0.30000000000000004
```

If your use case requires exact decimal arithmetic (financial calculations,
tax computations, etc.) you can plug in [Decimal.js](https://mikemcl.github.io/decimal.js/)
by implementing a custom `Calculator`.

> **Note:** ESCalc itself has zero dependencies. `decimal.js` must be installed separately.

### Install Decimal.js

```bash
npm install decimal.js
```

### Implement DecimalCalculator

```ts
import Decimal from "decimal.js";
import {
  StandardCalculator,
  type CalculatorArgument,
  ESCalcError,
} from "escalc";

function dec(arg: CalculatorArgument): Decimal {
  const value = arg.evaluate();
  if (typeof value === "number") return new Decimal(value);
  if (value instanceof Decimal) return value;
  throw new ESCalcError(`Expected a number, got ${typeof value}`);
}

export class DecimalCalculator extends StandardCalculator {
  override add(l: CalculatorArgument, r: CalculatorArgument): unknown {
    return dec(l).plus(dec(r));
  }
  override sub(l: CalculatorArgument, r: CalculatorArgument): unknown {
    return dec(l).minus(dec(r));
  }
  override mul(l: CalculatorArgument, r: CalculatorArgument): unknown {
    return dec(l).times(dec(r));
  }
  override div(l: CalculatorArgument, r: CalculatorArgument): unknown {
    return dec(l).dividedBy(dec(r));
  }
  override modulus(l: CalculatorArgument, r: CalculatorArgument): unknown {
    return dec(l).mod(dec(r));
  }
  override exponentiation(
    l: CalculatorArgument,
    r: CalculatorArgument,
  ): unknown {
    return dec(l).pow(dec(r));
  }
  override negate(l: CalculatorArgument): unknown {
    return dec(l).negated();
  }
  override equals(l: CalculatorArgument, r: CalculatorArgument): unknown {
    const lv = l.evaluate();
    const rv = r.evaluate();
    if (lv instanceof Decimal && rv instanceof Decimal) return lv.equals(rv);
    return super.equals(l, r);
  }
  override greaterThan(l: CalculatorArgument, r: CalculatorArgument): unknown {
    const lv = l.evaluate();
    const rv = r.evaluate();
    if (lv instanceof Decimal && rv instanceof Decimal)
      return lv.greaterThan(rv);
    return super.greaterThan(l, r);
  }
  override lessThan(l: CalculatorArgument, r: CalculatorArgument): unknown {
    const lv = l.evaluate();
    const rv = r.evaluate();
    if (lv instanceof Decimal && rv instanceof Decimal) return lv.lessThan(rv);
    return super.lessThan(l, r);
  }
  override greaterThanOrEqual(
    l: CalculatorArgument,
    r: CalculatorArgument,
  ): unknown {
    const lv = l.evaluate();
    const rv = r.evaluate();
    if (lv instanceof Decimal && rv instanceof Decimal)
      return lv.greaterThanOrEqualTo(rv);
    return super.greaterThanOrEqual(l, r);
  }
  override lessThanEqual(
    l: CalculatorArgument,
    r: CalculatorArgument,
  ): unknown {
    const lv = l.evaluate();
    const rv = r.evaluate();
    if (lv instanceof Decimal && rv instanceof Decimal)
      return lv.lessThanOrEqualTo(rv);
    return super.lessThanEqual(l, r);
  }
}
```

### Usage

```ts
import { evaluate } from "escalc";
import { DecimalCalculator } from "./decimal-calculator";

const calc = new DecimalCalculator();

evaluate("0.1 + 0.2", { calculator: calc });
// => Decimal { '0.3' }   (exact)

evaluate("[price] * [qty]", {
  calculator: calc,
  params: new Map([
    ["price", new Decimal("9.99")],
    ["qty", new Decimal("3")],
  ]),
});
// => Decimal { '29.97' }
```

### Tips

- Pass `Decimal` instances as parameter values to preserve precision end-to-end.
- Literal numbers in expressions (e.g. `0.1`) are still parsed as JavaScript
  `number` first. The `dec()` helper above converts them to `Decimal` transparently.
- Comparison operators need overriding too - `Decimal` instances are not natively
  comparable with `>` / `<` etc.
- For production use, consider also overriding `Round`, `Floor`, `Ceiling`, and
  the other built-in math functions by registering custom versions via the
  `functions` option.
