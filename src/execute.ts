import type { Parameter } from "./evaluate";
import { parse } from "./parse";
import type { Calculator } from "./types/calculator";
import type { LogicalExpression } from "./types/expression";
import { StandardCalculator } from "./classes/standard-calculator";
import {
  type ExpressionFunction,
  type LazyParameter,
  StandardEvaluator,
} from "./classes/standard-evaluator";
import { ESCalcError } from "./classes/escalc-error";

/**
 * Options for {@link execute} and {@link executeSafe}.
 * Identical to {@link EvaluateOptions}.
 */
export type ExecuteOptions = {
  /**
   * Named parameter values available during expression execution.
   * Keys are parameter names used in the expression - without surrounding brackets.
   */
  params?: Map<string, Parameter>;
  /** Named parameters whose values are computed on demand the first time they are referenced. */
  lazyParams?: Map<string, LazyParameter>;
  /** Custom functions available by name within expressions. */
  functions?: Map<string, ExpressionFunction>;
  /**
   * Custom operator implementation. Defaults to {@link StandardCalculator}.
   * Override to change how operators behave.
   */
  calculator?: Calculator;
  /**
   * Stop parsing on the first recoverable error when `expression` is provided as a string.
   * @defaultValue true
   */
  stopOnFirstError?: boolean;
};

/**
 * Execute a pre-parsed (or string) NCalc expression.
 *
 * Unlike {@link evaluate}, this function emphasises that execution is separate from parsing.
 * When `expression` is a string it is parsed internally, but prefer {@link evaluate} for
 * single-shot parse-and-evaluate. Use `execute` when you need to hold a {@link StandardEvaluator}
 * or pass custom options without re-parsing.
 *
 * @param expression - A pre-parsed {@link LogicalExpression} or NCalc expression string.
 * @param options - Execution options: parameters, custom functions, and operator overrides.
 * @returns The result produced by executing the expression.
 * @throws {@link ParserError} If `expression` is a string that cannot be parsed.
 * @throws {@link ESCalcError} If a runtime error occurs during execution.
 *
 * @example
 * ```ts
 * import { parse, execute } from 'escalc';
 *
 * const ast = parse('[price] * (1 + [tax])');
 *
 * // Reuse the same AST with different parameters
 * execute(ast, { params: new Map([['price', 100], ['tax', 0.2]]) });  // => 120
 * execute(ast, { params: new Map([['price', 200], ['tax', 0.1]]) });  // => 220
 * ```
 */
export function execute(
  expression: string | LogicalExpression,
  options?: ExecuteOptions,
): unknown {
  const expressionToEvaluate =
    typeof expression === "string"
      ? parse(
        expression,
        options?.stopOnFirstError === undefined
          ? undefined
          : { stopOnFirstError: options.stopOnFirstError },
      )
      : expression;

  const {
    params = new Map<string, Parameter>(),
    lazyParams = new Map<string, LazyParameter>(),
    functions = new Map<string, ExpressionFunction>(),
    calculator = new StandardCalculator(),
  } = options ?? {};
  const evaluator = new StandardEvaluator({
    params,
    functions,
    lazyParams,
    calculator,
  });
  return evaluator.logical(expressionToEvaluate);
}

/**
 * The same as {@link execute} but returns a discriminated union instead of throwing.
 * Non-`ESCalcError` exceptions are still re-thrown.
 *
 * @param expression - A pre-parsed {@link LogicalExpression} or NCalc expression string.
 * @param options - Execution options.
 * @returns `{ type: 'success', result }` on success, or `{ type: 'error', error }` on failure.
 */
export function executeSafe(
  expression: string | LogicalExpression,
  options?: ExecuteOptions,
): { type: "success"; result: unknown } | { type: "error"; error: ESCalcError } {
  try {
    return { type: "success", result: execute(expression, options) };
  } catch (error) {
    if (error instanceof ESCalcError) {
      return { type: "error", error };
    }
    throw error;
  }
}
