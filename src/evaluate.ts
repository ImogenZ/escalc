import { parse } from "./parse";
import type { Calculator } from "./types/calculator";
import type { LogicalExpression } from "./types/expression";
import type {
  ExpressionFunction,
  LazyParameter,
} from "./classes/standard-evaluator";
import { execute } from "./execute";
import { ESCalcError } from "./classes/escalc-error";

/**
 * Options for {@link evaluate} and {@link evaluateSafe}.
 */
export type EvaluateOptions = {
  /**
   * Named parameter values available during expression evaluation.
   * Keys are parameter names used in the expression - without surrounding brackets.
   *
   * @example
   * ```ts
   * new Map([['x', 10], ['label', 'hello']])
   * ```
   */
  params?: Map<string, Parameter>;
  /** Named parameters whose values are computed on demand the first time they are referenced. */
  lazyParams?: Map<string, LazyParameter>;
  /** Custom functions available by name within expressions. */
  functions?: Map<string, ExpressionFunction>;
  /**
   * Custom operator implementation. Defaults to {@link StandardCalculator}.
   * Override to change how operators behave - for example to support
   * arbitrary-precision arithmetic via a library such as Decimal.js.
   */
  calculator?: Calculator;
  /**
   * Stop parsing on the first recoverable error when `expression` is provided as a string.
   * @defaultValue true
   */
  stopOnFirstError?: boolean;
};

/** A named parameter value. May be any JavaScript value, including `null` and `undefined`. */
export type Parameter = unknown;

/**
 * Parse and evaluate an NCalc expression in a single step.
 *
 * When `expression` is a `string` it is first parsed into an AST then evaluated.
 * Passing a pre-parsed {@link LogicalExpression} skips the parse step.
 *
 * @param expression - An NCalc expression string or a pre-parsed {@link LogicalExpression}.
 * @param options - Evaluation options: parameters, custom functions, and operator overrides.
 * @returns The result produced by evaluating the expression.
 * @throws {@link ParserError} If `expression` is a string that cannot be parsed.
 * @throws {@link ESCalcError} If a runtime error occurs during evaluation
 *   (e.g. referencing an unknown parameter, or a type mismatch in an operator).
 *
 * @example
 * ```ts
 * import { evaluate } from 'escalc';
 *
 * evaluate('1 + 2');  // => 3
 *
 * evaluate('[x] * [y]', { params: new Map([['x', 3], ['y', 4]]) });  // => 12
 *
 * evaluate('Max(Abs(-5), 2)');  // => 5
 * ```
 */
export function evaluate(
  expression: string | LogicalExpression,
  options?: EvaluateOptions,
): unknown {
  const expr =
    typeof expression === "string"
      ? parse(
        expression,
        options?.stopOnFirstError === undefined
          ? undefined
          : { stopOnFirstError: options.stopOnFirstError },
      )
      : expression;

  return execute(expr, options);
}

/**
 * The same as {@link evaluate} but returns a discriminated union instead of throwing.
 * Non-`ESCalcError` exceptions are still re-thrown.
 *
 * @param expression - An NCalc expression string or a pre-parsed {@link LogicalExpression}.
 * @param options - Evaluation options.
 * @returns `{ type: 'success', result }` on success, or `{ type: 'error', error }` on failure.
 *
 * @example
 * ```ts
 * const result = evaluateSafe('[x] + 1', { params: new Map([['x', 5]]) });
 * if (result.type === 'success') {
 *   console.log(result.result); // 6
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function evaluateSafe(
  expression: string | LogicalExpression,
  options?: EvaluateOptions,
): { type: "success"; result: unknown } | { type: "error"; error: ESCalcError } {
  try {
    return { type: "success", result: evaluate(expression, options) };
  } catch (error) {
    if (error instanceof ESCalcError) {
      return { type: "error", error };
    }
    throw error;
  }
}
