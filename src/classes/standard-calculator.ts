import type { Calculator, CalculatorArgument } from "../types/calculator";

import { ESCalcError, RuntimeError } from "./escalc-error";

export class StandardCalculator implements Calculator {
  modulus(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue % rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  exponentiation(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue ** rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  in(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return rightValue.includes(leftValue);
    }

    if (!Array.isArray(rightValue)) {
      throw new RuntimeError(RUNTIME_ERROR_MESSAGE_EXPECTED_ARRAY);
    }

    return rightValue.includes(leftValue);
  }
  notIn(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return !rightValue.includes(leftValue);
    }

    if (!Array.isArray(rightValue)) {
      throw new RuntimeError(RUNTIME_ERROR_MESSAGE_EXPECTED_ARRAY);
    }

    return !rightValue.includes(leftValue);
  }
  greaterThan(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue > rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return leftValue > rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  lessThan(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue < rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return leftValue < rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  greaterThanOrEqual(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue >= rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return leftValue.getTime() >= rightValue.getTime();
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  lessThanEqual(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return left <= right;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return rightValue.getTime() <= rightValue.getTime();
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  notEquals(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "boolean" && typeof rightValue === "boolean") {
      return left !== right;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue !== rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return leftValue.getTime() !== rightValue.getTime();
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }

  equals(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return leftValue === rightValue;
    }
    if (typeof leftValue === "boolean" && typeof rightValue === "boolean") {
      return leftValue === rightValue;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue === rightValue;
    }

    if (leftValue instanceof Date && rightValue instanceof Date) {
      return leftValue.getTime() === rightValue.getTime();
    }

    throw new ESCalcError(
      runtimeErrorMessageNotImplementedComparison(leftValue, rightValue),
    );
  }
  and(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();

    if (typeof leftValue === "boolean") {
      if (!leftValue) {
        return false;
      }

      return right.evaluate();
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  or(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();

    if (typeof leftValue === "boolean") {
      if (leftValue) {
        return true;
      }

      return right.evaluate();
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitAnd(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue & rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitOr(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue | rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitXor(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue ^ rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitLeftShift(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue << rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitRightShift(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue >> rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  not(left: CalculatorArgument): unknown {
    const leftValue = left.evaluate();
    if (typeof leftValue === "boolean") {
      return !leftValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  bitComplement(left: CalculatorArgument): unknown {
    const leftValue = left.evaluate();
    if (typeof leftValue === "number") {
      return ~leftValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  negate(left: CalculatorArgument): unknown {
    const leftValue = left.evaluate();
    if (typeof leftValue === "number") {
      return -leftValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  sub(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue - rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  div(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue / rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }
  mul(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue * rightValue;
    }
    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }

  add(
    left: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    const rightValue = right.evaluate();
    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return leftValue + rightValue;
    }

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return leftValue + rightValue;
    }

    throw new ESCalcError(RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED);
  }

  ternary(
    left: CalculatorArgument,
    middle: CalculatorArgument,
    right: CalculatorArgument,
  ): unknown {
    const leftValue = left.evaluate();
    if (typeof leftValue !== "boolean") {
      throw new RuntimeError(RUNTIME_ERROR_MESSAGE_EXPECTED_BOOLEAN);
    }
    return leftValue ? middle.evaluate() : right.evaluate();
  }
}
const RUNTIME_ERROR_MESSAGE_NOT_IMPLEMENTED = "Not implemented";

const RUNTIME_ERROR_MESSAGE_EXPECTED_ARRAY = "Expected array";

const RUNTIME_ERROR_MESSAGE_EXPECTED_BOOLEAN = "Expected boolean";

const runtimeErrorMessageNotImplementedComparison = (
  leftValue: unknown,
  rightValue: unknown,
): string =>
  `Not implemented ${JSON.stringify(leftValue)}=${JSON.stringify(rightValue)}`;
