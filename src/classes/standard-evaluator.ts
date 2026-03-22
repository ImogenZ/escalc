import type { Parameter } from "../evaluate";
import type { Calculator, CalculatorArgument } from "../types/calculator";
import { AbstractVisitor } from "./abstract-visitor";
import type {
  BinaryExpression,
  FunctionExpression,
  LogicalExpression,
  TernaryExpression,
  UnaryExpression,
  ValueExpression,
} from "../types/expression";
import { ESCalcError, RuntimeError } from "./escalc-error";

export type FunctionContext = {
  params: Map<string, Parameter>;
  lazyParams: Map<string, LazyParameter>;
  functions: Map<string, ExpressionFunction>;
  calculator: Calculator;
};

export type FunctionArgument = {
  expression: LogicalExpression;
  evaluate: () => unknown;
};

export type ExpressionFunction = (
  args: FunctionArgument[],
  options: FunctionContext,
) => unknown;

export type LazyParameter = () => unknown;

export type EvaluatorOptions = {
  params: Map<string, Parameter>;
  lazyParams: Map<string, LazyParameter>;
  functions: Map<string, ExpressionFunction>;
  calculator: Calculator;
};

/**
 * The tree-walk evaluator that traverses a {@link LogicalExpression} AST and produces a result.
 *
 * Extends {@link AbstractVisitor}<`unknown`> and implements every visit method by
 * delegating operator evaluation to the provided {@link Calculator}.
 *
 * You generally do not need to instantiate this class directly - use
 * {@link evaluate} or {@link execute} instead. Construct it manually only when
 * you need fine-grained control over the evaluation lifecycle.
 *
 * @example
 * ```ts
 * import { parse, StandardEvaluator, StandardCalculator } from 'escalc';
 *
 * const ast = parse('1 + [x]');
 * const evaluator = new StandardEvaluator({
 *   params: new Map([['x', 5]]),
 *   lazyParams: new Map(),
 *   functions: new Map(),
 *   calculator: new StandardCalculator(),
 * });
 * evaluator.logical(ast); // => 6
 * ```
 */
export class StandardEvaluator extends AbstractVisitor<unknown> {
  readonly #params: Map<string, Parameter>;
  readonly #lazyParams: Map<string, LazyParameter>;
  readonly #functions: Map<string, ExpressionFunction>;
  readonly #calculator: Calculator;

  constructor({
    params,
    lazyParams,
    functions,
    calculator,
  }: EvaluatorOptions) {
    super();
    this.#params = params;
    this.#lazyParams = lazyParams;
    this.#functions = functions;
    this.#calculator = calculator;
  }

  override binary(expression: BinaryExpression): unknown {
    const leftParam: CalculatorArgument = this.#calculatorArgument(
      expression.left,
    );
    const rightParam: CalculatorArgument = this.#calculatorArgument(
      expression.right,
    );

    switch (expression.operator) {
      case "modulus":
        return this.#calculator.modulus(leftParam, rightParam);
      case "exponentiation":
        return this.#calculator.exponentiation(leftParam, rightParam);
      case "in":
        return this.#calculator.in(leftParam, rightParam);
      case "not-in":
        return this.#calculator.notIn(leftParam, rightParam);
      case "subtraction":
        return this.#calculator.sub(leftParam, rightParam);
      case "addition":
        return this.#calculator.add(leftParam, rightParam);
      case "multiplication":
        return this.#calculator.mul(leftParam, rightParam);
      case "division":
        return this.#calculator.div(leftParam, rightParam);
      case "greater-than":
        return this.#calculator.greaterThan(leftParam, rightParam);
      case "less-than":
        return this.#calculator.lessThan(leftParam, rightParam);
      case "greater-than-equal":
        return this.#calculator.greaterThanOrEqual(leftParam, rightParam);
      case "less-than-equal":
        return this.#calculator.lessThanEqual(leftParam, rightParam);
      case "not-equals":
        return this.#calculator.notEquals(leftParam, rightParam);
      case "equals":
        return this.#calculator.equals(leftParam, rightParam);
      case "and":
        return this.#calculator.and(leftParam, rightParam);
      case "or":
        return this.#calculator.or(leftParam, rightParam);
      case "bit-and":
        return this.#calculator.bitAnd(leftParam, rightParam);
      case "bit-or":
        return this.#calculator.bitOr(leftParam, rightParam);
      case "bit-xor":
        return this.#calculator.bitXor(leftParam, rightParam);
      case "bit-left-shift":
        return this.#calculator.bitLeftShift(leftParam, rightParam);
      case "bit-right-shift":
        return this.#calculator.bitRightShift(leftParam, rightParam);
    }
  }

  override unary(expression: UnaryExpression): unknown {
    const param = this.#calculatorArgument(expression.expression);
    switch (expression.operator) {
      case "not":
        return this.#calculator.not(param);
      case "bit-complement":
        return this.#calculator.bitComplement(param);
      case "negate":
        return this.#calculator.negate(param);
    }
  }

  override value(expression: ValueExpression): unknown {
    switch (expression.value.type) {
      case "list":
        return expression.value.items.map((item) => this.logical(item));
      case "constant":
        return this.#create(expression.value.value);
      case "parameter": {
        if (this.#params.has(expression.value.name))
          return this.#params.get(expression.value.name);

        if (this.#lazyParams.has(expression.value.name))
          return this.#lazyParams.get(expression.value.name)?.();

        throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_NO_ARGUMENTS);
      }
    }
  }

  override function(expression: FunctionExpression): unknown {
    const args = expression.arguments.map((arg) =>
      this.#calculatorArgument(arg),
    );

    const options = {
      functions: this.#functions,
      params: this.#params,
      lazyParams: this.#lazyParams,
      calculator: this.#calculator,
    };

    const fun = this.#functions.get(expression.name);
    if (fun !== undefined) {
      return fun(args, options);
    }

    const builtIn = builtInsMap[expression.name];
    if (builtIn !== undefined) {
      return builtIn(args, options);
    }

    throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_METHOD_NOT_IMPLEMENTED);
  }

  override ternary(expression: TernaryExpression): unknown {
    const leftParam = this.#calculatorArgument(expression.left);
    const middleParam = this.#calculatorArgument(expression.middle);
    const rightParam = this.#calculatorArgument(expression.right);

    return this.#calculator.ternary(leftParam, middleParam, rightParam);
  }

  #calculatorArgument(expression: LogicalExpression): CalculatorArgument {
    return {
      evaluate: () => this.logical(expression),
      expression,
    };
  }

  #create({
    value,
    type,
  }: Extract<
    ValueExpression["value"],
    { type: "constant" }
  >["value"]): unknown {
    switch (type) {
      case "number":
        return Number(value);
      case "boolean": {
        if (value === "false") return false;
        if (value === "true") return true;
        throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_INVALID_BOOLEAN_VALUE);
      }
      case "string":
        return value;
      case "date":
        return new Date(value);
    }
  }
}

export const builtIns = {
  Abs: (args) => Math.abs(asNumber(args[0])),
  Acos: (args) => Math.acos(asNumber(args[0])),
  Asin: (args) => Math.asin(asNumber(args[0])),
  Atan: (args) => Math.atan(asNumber(args[0])),
  Ceiling: (args) => Math.ceil(asNumber(args[0])),
  Cos: (args) => Math.cos(asNumber(args[0])),
  Exp: (args) => Math.exp(asNumber(args[0])),
  Floor: (args) => Math.floor(asNumber(args[0])),
  IEEERemainder: (args) => ieeeRemainder(asNumber(args[0]), asNumber(args[1])),
  Ln: (args) => Math.log(asNumber(args[0])),
  Log: (args) => {
    if (args.length === 1) return Math.log(asNumber(args[0]));
    return Math.log(asNumber(args[0])) / Math.log(asNumber(args[1]));
  },
  Log10: (args) => Math.log10(asNumber(args[0])),
  Max: (args) => Math.max(asNumber(args[0]), asNumber(args[1])),
  Min: (args) => Math.min(asNumber(args[0]), asNumber(args[1])),
  Pow: (args) => asNumber(args[0]) ** asNumber(args[1]),
  Round: (args) =>
    args.length === 2
      ? roundTo(asNumber(args[0]), asNumber(args[1]))
      : Math.round(asNumber(args[0])),
  Sign: (args) => Math.sign(asNumber(args[0])),
  Sin: (args) => Math.sin(asNumber(args[0])),
  Sqrt: (args) => Math.sqrt(asNumber(args[0])),
  Tan: (args) => Math.tan(asNumber(args[0])),
  Truncate: (args) => truncate(asNumber(args[0])),
  if: (args) => {
    if (args.length !== 3) {
      throw new ESCalcError(
        EVALUATOR_ERROR_MESSAGE_IF_REQUIRES_THREE_PARAMETERS,
      );
    }
    const condition = args[0].evaluate();
    if (typeof condition !== "boolean") {
      throw new RuntimeError(EVALUATOR_ERROR_MESSAGE_CONDITION_MUST_BE_BOOLEAN);
    }
    return condition ? args[1].evaluate() : args[2].evaluate();
  },
  ifs: (args) => {
    if (args.length < 3) {
      throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_NOT_ENOUGH_PARAMETERS);
    }

    if (args.length % 2 === 0) {
      throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_DEFAULT_MUST_BE_PROVIDED);
    }

    let i = 0;
    for (; i < args.length - 1; i += 2) {
      const condition = args[i].evaluate();
      if (typeof condition !== "boolean") {
        throw new RuntimeError(
          EVALUATOR_ERROR_MESSAGE_CONDITION_MUST_BE_BOOLEAN,
        );
      }
      if (condition) return args[i + 1].evaluate();
    }
    const defaultArg = args.at(-1);
    if (defaultArg === undefined) {
      throw new ESCalcError(EVALUATOR_ERROR_MESSAGE_EXPECT_DEFAULT);
    }
    return defaultArg.evaluate();
  },
} as const satisfies Partial<
  Record<string, ExpressionFunction>
>;

const builtInsMap: Partial<
  Record<string, ExpressionFunction>
> = builtIns;

function asNumber(param?: FunctionArgument): number {
  if (param === undefined) {
    throw new RuntimeError(evaluatorErrorMessageExpectedNumberGotNothing);
  }

  const value = param.evaluate();
  if (typeof value !== "number") {
    throw new RuntimeError(evaluatorErrorMessageExpectedNumber(typeof value));
  }
  return value;
}

function ieeeRemainder(x: number, y: number): number {
  return x - y * Math.round(x / y);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function truncate(value: number): number {
  return value < 0 ? Math.ceil(value) : Math.floor(value);
}

const EVALUATOR_ERROR_MESSAGE_NO_ARGUMENTS = "No arguments";

const EVALUATOR_ERROR_MESSAGE_METHOD_NOT_IMPLEMENTED = "Method not implemented";

const EVALUATOR_ERROR_MESSAGE_INVALID_BOOLEAN_VALUE = "Invalid boolean value";

const EVALUATOR_ERROR_MESSAGE_IF_REQUIRES_THREE_PARAMETERS =
  "If requires three parameters";

const EVALUATOR_ERROR_MESSAGE_CONDITION_MUST_BE_BOOLEAN =
  "Condition must be a boolean";

const EVALUATOR_ERROR_MESSAGE_NOT_ENOUGH_PARAMETERS = "Not enough parameters";

const EVALUATOR_ERROR_MESSAGE_DEFAULT_MUST_BE_PROVIDED =
  "Default must be provided";

const EVALUATOR_ERROR_MESSAGE_EXPECT_DEFAULT = "Expected default";

const evaluatorErrorMessageExpectedNumberGotNothing =
  "Expected number, got nothing";

const evaluatorErrorMessageExpectedNumber = (type: string): string =>
  `Expected number, got ${type}`;
