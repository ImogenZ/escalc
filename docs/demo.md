# Demos

Complete worked examples showing ESCalc in real-world scenarios.

---

## 1. Simple arithmetic and comparisons

```ts
import { evaluate } from "@imogenz/escalc";

// Arithmetic
evaluate("(3 + 4) * 2"); // => 14
evaluate("10 % 3"); // => 1
evaluate("2 ** 10"); // => 1024
evaluate("Sqrt(144)"); // => 12
evaluate("Round(3.14159, 2)"); // => 3.14

// Comparison
evaluate("5 > 3"); // => true
evaluate("10 == 10"); // => true
evaluate('"hello" != "world"'); // => true

// Logical
evaluate("true && false"); // => false
evaluate("true || false"); // => true
evaluate("!false"); // => true
```

---

## 2. Dynamic pricing with parameters

Compute a final price after applying a discount tier and tax:

```ts
import { evaluate } from "@imogenz/escalc";

function calcPrice(
  unitPrice: number,
  qty: number,
  discount: number,
  taxRate: number,
): number {
  return evaluate("[unitPrice] * [qty] * (1 - [discount]) * (1 + [taxRate])", {
    params: new Map([
      ["unitPrice", unitPrice],
      ["qty", qty],
      ["discount", discount],
      ["taxRate", taxRate],
    ]),
  }) as number;
}

calcPrice(10, 5, 0.1, 0.2); // => 54  (10 * 5 * 0.9 * 1.2)
```

---

## 3. Custom function: string operations

Register custom functions to extend the expression language:

```ts
import { evaluate, type ExpressionFunction } from "@imogenz/escalc";

const upper: ExpressionFunction = (args) =>
  (args[0].evaluate() as string).toUpperCase();

const startsWith: ExpressionFunction = (args) => {
  const str = args[0].evaluate() as string;
  const prefix = args[1].evaluate() as string;
  return str.startsWith(prefix);
};

const customFns = new Map<string, ExpressionFunction>([
  ["upper", upper],
  ["startsWith", startsWith],
]);

evaluate("upper([greeting])", {
  params: new Map([["greeting", "hello"]]),
  functions: customFns,
}); // => 'HELLO'

evaluate('startsWith([code], "UK")', {
  params: new Map([["code", "UK-001"]]),
  functions: customFns,
}); // => true
```

---

## 4. Validate then execute (parse + execute separately)

Parse once to validate user input, then reuse the AST for repeated evaluation:

```ts
import { parseSafe, execute, parameters } from "@imogenz/escalc";

function buildEvaluator(formula: string) {
  const result = parseSafe(formula);

  if (result.type === "error") {
    const issues = result.error.errors.map((e) => e.detailedMessage).join("\n");
    throw new Error(`Invalid formula:\n${issues}`);
  }

  const ast = result.expression;
  const { names } = parameters(ast);

  // Return a function that validates params and evaluates
  return (values: Record<string, unknown>) => {
    const missing = [...names].filter((n) => !(n in values));
    if (missing.length) {
      throw new Error(`Missing: ${missing.join(", ")}`);
    }
    return execute(ast, { params: new Map(Object.entries(values)) });
  };
}

const calcTax = buildEvaluator("[amount] * [rate]");
calcTax({ amount: 1000, rate: 0.2 }); // => 200
calcTax({ amount: 500, rate: 0.1 }); // => 50
```

---

## 5. Multi-branch conditional with `ifs`

```ts
import { evaluate } from "@imogenz/escalc";

function tier(score: number): string {
  return evaluate(
    'ifs([score] >= 90, "A", [score] >= 70, "B", [score] >= 50, "C", "F")',
    { params: new Map([["score", score]]) },
  ) as string;
}

tier(95); // => 'A'
tier(75); // => 'B'
tier(55); // => 'C'
tier(40); // => 'F'
```

---

## 6. Date comparisons

```ts
import { evaluate } from "@imogenz/escalc";

// Date literals are written as #YYYY-MM-DD#
evaluate("#2024-06-01# > #2024-01-01#"); // => true

// Compare with a runtime Date via parameters
evaluate("[today] > #2020-01-01#", {
  params: new Map([["today", new Date()]]),
}); // => true (assuming today is after 2020)
```
