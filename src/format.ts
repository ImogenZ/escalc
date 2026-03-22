import type { LogicalExpression } from "./types/expression";
import { ESCalcError } from "./classes/escalc-error";
import { parse } from "./parse";

/**
 * Serialize a {@link LogicalExpression} (or expression string) to a canonical string representation.
 *
 * Useful for normalising user-provided expressions: whitespace is standardised,
 * parameter names are wrapped in `[brackets]`, and operators are rendered consistently.
 * Parsing followed by formatting acts as a round-trip normaliser.
 *
 * @param expression - An NCalc expression string or a pre-parsed {@link LogicalExpression}.
 * @returns The canonical string form of the expression.
 * @throws {@link ParserError} If `expression` is a string that cannot be parsed.
 * @throws {@link ESCalcError} If the AST contains an unrecognised node type.
 *
 * @example
 * ```ts
 * import { format } from 'escalc';
 *
 * format('1+2');             // => '1 + 2'
 * format('[x]*[y]');         // => '[x] * [y]'
 * format('a not in (1,2)'); // => '[a] not in 1,2'
 * ```
 */
export function format(expression: string | LogicalExpression): string {
  if (typeof expression === "string") {
    return formatter(parse(expression));
  }
  return formatter(expression);
}

/**
 * The same as {@link format} but returns a discriminated union instead of throwing.
 *
 * @param expression - An NCalc expression string or a pre-parsed {@link LogicalExpression}.
 * @returns `{ type: 'success', result }` on success, or `{ type: 'error', error }` on failure.
 */
export function formatSafe(
  expression: string | LogicalExpression,
): { type: "success"; result: string } | { type: "error"; error: ESCalcError } {
  try {
    return { type: "success", result: format(expression) };
  } catch (error) {
    if (error instanceof ESCalcError) {
      return { type: "error", error };
    }
    throw error;
  }
}

function formatter(expression: LogicalExpression): string {
  switch (expression.type) {
    case "value":
      {
        switch (expression.value.type) {
          case "list":
            return expression.value.items
              .map((item) => formatter(item))
              .join(",");
          case "constant":
            return expression.value.value.value;
          case "parameter": {
            return `[${expression.value.name}]`;
          }
        }
      }
      break;
    case "ternary": {
      const leftParam = formatter(expression.left);
      const middleParam = formatter(expression.middle);
      const rightParam = formatter(expression.right);

      return `${leftParam} ? ${middleParam} : ${rightParam}`;
    }
    case "binary":
      {
        const leftParam = formatter(expression.left);
        const rightParam = formatter(expression.right);

        switch (expression.operator) {
          case "modulus":
            return `${leftParam} % ${rightParam}`;
          case "exponentiation":
            return `${leftParam} ** ${rightParam}`;
          case "in":
            return `${leftParam} in ${rightParam}`;
          case "not-in":
            return `${leftParam} not in ${rightParam}`;
          case "subtraction":
            return `${leftParam} - ${rightParam}`;
          case "addition":
            return `${leftParam} + ${rightParam}`;
          case "multiplication":
            return `${leftParam} * ${rightParam}`;
          case "division":
            return `${leftParam} / ${rightParam}`;
          case "greater-than":
            return `${leftParam} > ${rightParam}`;
          case "less-than":
            return `${leftParam} < ${rightParam}`;
          case "greater-than-equal":
            return `${leftParam} >= ${rightParam}`;
          case "less-than-equal":
            return `${leftParam} <= ${rightParam}`;
          case "not-equals":
            return `${leftParam} != ${rightParam}`;
          case "equals":
            return `${leftParam} == ${rightParam}`;
          case "and":
            return `${leftParam} && ${rightParam}`;
          case "or":
            return `${leftParam} || ${rightParam}`;
          case "bit-and":
            return `${leftParam} & ${rightParam}`;
          case "bit-or":
            return `${leftParam} | ${rightParam}`;
          case "bit-xor":
            return `${leftParam} ^ ${rightParam}`;
          case "bit-left-shift":
            return `${leftParam} << ${rightParam}`;
          case "bit-right-shift":
            return `${leftParam} >> ${rightParam}`;
        }
      }
      break;
    case "unary":
      {
        const param = formatter(expression.expression);

        switch (expression.operator) {
          case "not":
            return `!${param}`;
          case "bit-complement":
            return `~${param}`;
          case "negate":
            return `-${param}`;
        }
      }
      break;
    case "function": {
      return `${expression.name}(${expression.arguments.map(formatter).join(",")})`;
    }
  }
}
