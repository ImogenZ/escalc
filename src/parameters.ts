import type { LogicalExpression } from "./types/expression";
import { builtIns } from "./classes/standard-evaluator";
import { parse } from "./parse";

/**
 * Extract all parameter names and non-built-in function names referenced by an expression.
 *
 * Built-in functions (e.g. `Abs`, `Sin`, `if`) are excluded from the `functions` set
 * because they are always available without any configuration.
 *
 * @param expression - An NCalc expression string or a pre-parsed {@link LogicalExpression}.
 * @returns An object with:
 *   - `names` - distinct parameter names (without brackets).
 *   - `functions` - distinct non-built-in function names.
 * @throws {@link ParserError} If `expression` is a string that cannot be parsed.
 *
 * @example
 * ```ts
 * import { parameters } from 'escalc';
 *
 * parameters('[price] * (1 + [tax]) + Abs([discount])');
 * // => { names: Set { 'price', 'tax', 'discount' }, functions: Set {} }
 *
 * parameters('myFn([x]) + Abs([x])');
 * // => { names: Set { 'x' }, functions: Set { 'myFn' } }
 * ```
 */
export function parameters(expression: string | LogicalExpression): {
  names: Set<string>;
  functions: Set<string>;
} {
  const ast = typeof expression === "string" ? parse(expression) : expression;
  const names = new Set<string>();
  const functions = new Set<string>();
  collect(ast, { names, functions });
  return { names, functions };
}

const builtinFunctionNames = new Set(Object.keys(builtIns));

function collect(
  expression: LogicalExpression,
  outputs: { names: Set<string>; functions: Set<string> },
): void {
  switch (expression.type) {
    case "value":
      {
        if (expression.value.type === "parameter") {
          outputs.names.add(expression.value.name);
        }
      }
      break;
    case "ternary":
      collect(expression.left, outputs);
      collect(expression.middle, outputs);
      collect(expression.right, outputs);
      break;
    case "binary":
      collect(expression.left, outputs);
      collect(expression.right, outputs);
      break;
    case "unary":
      collect(expression.expression, outputs);
      break;
    case "function":
      expression.arguments.forEach((arg) => {
        collect(arg, outputs);
      });

      if (!builtinFunctionNames.has(expression.name))
        outputs.functions.add(expression.name);
      break;
  }
}
