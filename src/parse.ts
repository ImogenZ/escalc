import type { LogicalExpression } from "./types/expression";
import { Parser, ParserError, type ParserOptions } from "./classes/parser";

/** Options for {@link parse} and {@link parseSafe}. */
export type ParseOptions = ParserOptions;

/**
 * Parse an NCalc expression string into an Abstract Syntax Tree (AST).
 *
 * The returned {@link LogicalExpression} can be inspected, passed to {@link execute},
 * {@link format}, or {@link parameters}.
 *
 * @param expression - The NCalc expression string to parse.
 * @param parserOptions - Optional parse settings.
 * @returns The root node of the parsed AST.
 * @throws {@link ParserError} If the expression contains syntax errors.
 *   The error includes an `errors` array of individual {@link ParseIssue} items,
 *   and an `incompleteExpression` field with a partial AST when `stopOnFirstError` is `false`.
 *
 * @example
 * ```ts
 * import { parse } from 'escalc';
 *
 * const ast = parse('1 + [x] * 2');
 * // ast.type === 'binary', ast.operator === 'addition'
 * ```
 */
export function parse(
  expression: string,
  parserOptions?: { stopOnFirstError?: boolean },
): LogicalExpression {
  const parser = new Parser(expression, parserOptions);
  return parser.parse();
}

/**
 * The same as {@link parse} but returns a discriminated union instead of throwing.
 *
 * @param expression - The NCalc expression string to parse.
 * @param parserOptions - Optional parse settings.
 * @returns `{ type: 'success', expression }` on success,
 *   or `{ type: 'error', error }` containing a {@link ParserError} on failure.
 *
 * @example
 * ```ts
 * const result = parseSafe('1 + ');
 * if (result.type === 'error') {
 *   console.error(result.error.errors[0].detailedMessage);
 * }
 * ```
 */
export function parseSafe(
  expression: string,
  parserOptions?: { stopOnFirstError?: boolean },
):
  | { type: "success"; expression: LogicalExpression }
  | {
    type: "error";
    error: ParserError;
  } {
  try {
    return { type: "success", expression: parse(expression, parserOptions) };
  } catch (error) {
    if (error instanceof ParserError) {
      return {
        type: "error",
        error,
      };
    }

    throw error;
  }
}
