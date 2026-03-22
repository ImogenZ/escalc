import type {
  BinaryExpression,
  FunctionExpression,
  LogicalExpression,
  TernaryExpression,
  UnaryExpression,
  ValueExpression,
} from "../types/expression";
import type { Visitor } from "../types/visitor";

export abstract class AbstractVisitor<T> implements Visitor<T> {
  logical(expression: LogicalExpression): T {
    switch (expression.type) {
      case "value":
        return this.value(expression);
      case "ternary":
        return this.ternary(expression);
      case "binary":
        return this.binary(expression);
      case "unary":
        return this.unary(expression);
      case "function":
        return this.function(expression);
    }
  }

  abstract ternary(expression: TernaryExpression): T;
  abstract binary(expression: BinaryExpression): T;
  abstract unary(expression: UnaryExpression): T;
  abstract value(expression: ValueExpression): T;
  abstract function(expression: FunctionExpression): T;
}
