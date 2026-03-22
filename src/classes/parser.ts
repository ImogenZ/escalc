import {
  Lexer,
  LexerError,
  type LexerErrorCode,
  type Token,
  type TokenType,
} from "./lexer";

import { ESCalcError } from "./escalc-error";
import { SourceRegion } from "./source-region";
import type {
  BinaryExpression,
  LogicalExpression,
  UnaryExpression,
} from "../types/expression";

export class ParserError extends ESCalcError {
  public readonly errors: readonly ParseIssue[];
  public readonly incompleteExpression: LogicalExpression | null;

  constructor(
    message: string,
    errors: readonly ParseIssue[],
    cause?: unknown,
    incompleteExpression: LogicalExpression | null = null,
  ) {
    super(message, { cause });
    this.errors = errors;
    this.incompleteExpression = incompleteExpression;

    Object.setPrototypeOf(this, ParserError.prototype);
  }
}

export class RecoverableParserError extends ESCalcError implements ParseIssue {
  public readonly code: RecoverableParserErrorCode;
  public readonly token: Token | null;

  constructor(
    code: RecoverableParserErrorCode,
    message: string,
    token: Token | null = null,
    cause?: unknown,
  ) {
    super(message, { cause });
    Object.setPrototypeOf(this, RecoverableParserError.prototype);
    this.code = code;
    this.token = token;
  }

  get where(): SourceRegion | null {
    return this.token?.location ?? null;
  }

  get detailedMessage(): string {
    if (this.token === null) {
      return this.message;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${this.message} got ${this.token.type} '${this.token.value}' at line ${this.token.location.line}, column ${this.token.location.column}`;
  }
}

export interface ParseIssue {
  readonly code: ParseIssueCode;
  readonly message: string;
  readonly where: SourceRegion | null;
  readonly detailedMessage: string;
}

export type RecoverableParserErrorCode =
  | "parser.expected-colon"
  | "parser.expected-in-after-not"
  | "parser.expected-group-close"
  | "parser.expected-value"
  | "parser.unknown-token-type";

export type ParseIssueCode = LexerErrorCode | RecoverableParserErrorCode;

export type ParserOptions = {
  stopOnFirstError?: boolean;
};

export class Parser {
  readonly #lexer: Lexer;
  readonly #errors: ParseIssue[] = [];
  readonly #stopOnFirstError: boolean;

  constructor(input: string, options?: ParserOptions) {
    this.#lexer = new Lexer(input);
    this.#stopOnFirstError = options?.stopOnFirstError ?? true;
  }

  #encloseLocations(
    ...locations: (SourceRegion | null)[]
  ): SourceRegion | null {
    let enclosedLocation: SourceRegion | null = null;

    for (const location of locations) {
      if (location === null) {
        continue;
      }

      enclosedLocation =
        enclosedLocation === null
          ? location
          : enclosedLocation.enclose(location);
    }

    return enclosedLocation;
  }

  #synchronise(): boolean {
    while (this.#lexer.peek() !== null) {
      const token = this.#lexer.peek();
      if (!token) return false;

      this.#lexer.next();
      if (isSyncToken(token.type)) {
        return true;
      }
    }
    return false;
  }

  parse(): LogicalExpression {
    let incompleteExpression: LogicalExpression | null = null;

    while (this.#lexer.peek() !== null) {
      try {
        const expression = this.#logicalExpression();
        incompleteExpression = expression;

        if (this.#lexer.peek() === null) {
          return expression;
        }

        throw new ParserError(
          PARSER_ERROR_MESSAGE_UNEXPECTED_TOKENS_AFTER_EXPRESSION,
          this.#errors,
          undefined,
          incompleteExpression,
        );
      } catch (e) {
        if (e instanceof RecoverableParserError || e instanceof LexerError) {
          if (this.#stopOnFirstError) {
            throw new ParserError(
              PARSER_ERROR_MESSAGE_FAILED_TO_PARSE_EXPRESSION,
              [e],
              e,
              incompleteExpression,
            );
          }

          this.#errors.push(e);

          if (!this.#synchronise()) {
            break;
          }

          continue;
        }
        throw e;
      }
    }

    throw new ParserError(
      PARSER_ERROR_MESSAGE_FAILED_TO_PARSE_EXPRESSION,
      this.#errors,
      undefined,
      incompleteExpression,
    );
  }

  #logicalExpression(): LogicalExpression {
    return this.#ternary();
  }

  #ternary(): LogicalExpression {
    let left = this.#or();

    for (; ;) {
      const matchedOperator = this.#match("ternary");
      if (matchedOperator === null) {
        return left;
      }

      const middle = this.#or();
      const colonToken = this.#match("colon");
      if (colonToken === null) {
        throw new RecoverableParserError(
          "parser.expected-colon",
          PARSER_ERROR_MESSAGE_EXPECTED_COLON,
          this.#lexer.peek() ?? null,
        );
      }

      const right = this.#or();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        middle.location,
        colonToken.location,
        right.location,
      );

      left = {
        type: "ternary",
        left,
        middle,
        right,
        location,
      };
    }
  }

  #or(): LogicalExpression {
    let left = this.#and();

    for (; ;) {
      const matchedOperator = this.#match("logical-or");
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(orOperatorMap, matchedOperator.type);
      const right = this.#and();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #and(): LogicalExpression {
    let left = this.#comparison();

    for (; ;) {
      const matchedOperator = this.#match("logical-and");
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(andOperatorMap, matchedOperator.type);
      const right = this.#comparison();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #comparison(): LogicalExpression {
    let left = this.#bitOr();

    for (; ;) {
      const notToken = this.#match("not");
      if (notToken !== null) {
        const inToken = this.#match("in");
        if (inToken === null) {
          throw new RecoverableParserError(
            "parser.expected-in-after-not",
            PARSER_ERROR_MESSAGE_EXPECTED_IN_AFTER_NOT,
            this.#lexer.peek() ?? null,
          );
        }
        const items = this.#bitOr();
        const location = this.#encloseLocations(
          left.location,
          notToken.location,
          inToken.location,
          items.location,
        );

        return {
          type: "binary",
          operator: "not-in",
          left,
          right: items,
          location,
        };
      }

      const inToken = this.#match("in");
      if (inToken !== null) {
        const items = this.#bitOr();
        const location = this.#encloseLocations(
          left.location,
          inToken.location,
          items.location,
        );

        return {
          type: "binary",
          operator: "in",
          left,
          right: items,
          location,
        };
      }

      const matchedOperator = this.#matchAnyOf([
        "more-than",
        "less-than",
        "less-than-or-equal",
        "more-than-or-equal",
        "not-equal",
        "equals",
        "equals",
        "logical-not",
      ]);

      if (matchedOperator === null) {
        return left;
      }
      const operator = lookupOrThrow(
        comparisonOperatorMap,
        matchedOperator.type,
      );
      const right = this.#bitOr();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #bitOr(): LogicalExpression {
    let left = this.#bitXor();

    for (; ;) {
      const matchedOperator = this.#match("bit-or");
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(bitOrOperatorMap, matchedOperator.type);
      const right = this.#bitXor();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #bitXor(): LogicalExpression {
    let left = this.#bitAnd();

    for (; ;) {
      const matchedOperator = this.#match("bit-xor");
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(bitXorOperatorMap, matchedOperator.type);
      const right = this.#bitAnd();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #bitAnd(): LogicalExpression {
    let left = this.#bitShift();

    for (; ;) {
      const matchedOperator = this.#match("bit-and");
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(bitAndOperatorMap, matchedOperator.type);
      const right = this.#bitShift();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #bitShift(): LogicalExpression {
    let left = this.#additive();

    for (; ;) {
      const matchedOperator = this.#matchAnyOf(["shift-right", "shift-left"]);
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(bitShiftOperatorMap, matchedOperator.type);
      const right = this.#additive();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #additive(): LogicalExpression {
    let left = this.#factor();

    for (; ;) {
      const matchedOperator = this.#matchAnyOf(["plus", "minus"]);
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(additionOperatorMap, matchedOperator.type);
      const right = this.#factor();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #factor(): LogicalExpression {
    let left = this.#exponentiation();

    for (; ;) {
      const matchedOperator = this.#matchAnyOf([
        "division",
        "times",
        "modulus",
      ]);
      if (matchedOperator === null) {
        return left;
      }

      const operator = lookupOrThrow(factorOperatorMap, matchedOperator.type);
      const right = this.#exponentiation();
      const location = this.#encloseLocations(
        left.location,
        matchedOperator.location,
        right.location,
      );

      left = {
        type: "binary",
        operator,
        left,
        right,
        location,
      };
    }
  }

  #exponentiation(): LogicalExpression {
    const left = this.#unary();

    const matchedOperator = this.#match("exp");
    if (matchedOperator === null) {
      return left;
    }

    const right = this.#exponentiation();
    const location = this.#encloseLocations(
      left.location,
      matchedOperator.location,
      right.location,
    );

    return {
      type: "binary",
      operator: "exponentiation",
      left,
      right,
      location,
    };
  }

  #unary(): LogicalExpression {
    const operators: {
      operator: UnaryExpression["operator"];
      token: Token;
    }[] = [];

    for (; ;) {
      const operatorToken = this.#matchAnyOf([
        "complement",
        "logical-not",
        "minus",
        "not",
      ]);
      if (operatorToken === null) {
        break;
      }

      operators.push({
        operator: lookupOrThrow(unaryOperatorMap, operatorToken.type),
        token: operatorToken,
      });
    }

    let expression = this.#value();
    for (const { operator, token } of operators) {
      const location = this.#encloseLocations(
        token.location,
        expression.location,
      );

      expression = {
        type: "unary",
        operator,
        expression,
        location,
      };
    }

    return expression;
  }

  #value(): LogicalExpression {
    const date = this.#match("date");
    if (date) {
      return {
        type: "value",
        value: {
          type: "constant",
          value: { type: "date", value: date.value },
        },
        location: date.location,
      };
    }
    const string = this.#match("string");
    if (string) {
      return {
        type: "value",
        value: {
          type: "constant",
          value: { type: "string", value: string.value },
        },
        location: string.location,
      };
    }

    const number = this.#match("number");
    if (number) {
      return {
        type: "value",
        value: {
          type: "constant",
          value: { type: "number", value: number.value },
        },
        location: number.location,
      };
    }
    const boolean = this.#match("boolean");
    if (boolean) {
      return {
        type: "value",
        value: {
          type: "constant",
          value: { type: "boolean", value: boolean.value },
        },
        location: boolean.location,
      };
    }

    const parameter = this.#match("parameter");
    if (parameter) {
      return {
        type: "value",
        value: { type: "parameter", name: parameter.value },
        location: parameter.location,
      };
    }

    const identifier = this.#match("identifier");
    if (identifier) {
      const args: LogicalExpression[] = [];
      const openToken = this.#match("group-open");

      if (openToken === null) {
        return {
          type: "value",
          value: { type: "parameter", name: identifier.value },
          location: identifier.location,
        };
      }

      let closeToken = this.#match("group-close");
      if (closeToken === null) {
        for (; ;) {
          args.push(this.#logicalExpression());

          if (this.#lexer.peek()?.type !== "separator") break;
          this.#lexer.next();
        }

        closeToken = this.#match("group-close");
        if (closeToken === null) {
          throw new RecoverableParserError(
            "parser.expected-group-close",
            PARSER_ERROR_MESSAGE_EXPECTED_GROUP_CLOSE,
            this.#lexer.peek() ?? undefined,
          );
        }
      }

      const location = this.#encloseLocations(
        identifier.location,
        openToken.location,
        ...args.map((arg) => arg.location),
        closeToken.location,
      );

      return {
        type: "function",
        name: identifier.value,
        arguments: args,
        location,
      };
    }

    const openToken = this.#match("group-open");
    if (openToken !== null) {
      const emptyListCloseToken = this.#match("group-close");
      if (emptyListCloseToken !== null) {
        const location = this.#encloseLocations(
          openToken.location,
          emptyListCloseToken.location,
        );

        return {
          type: "value",
          value: { type: "list", items: [] },
          location,
        };
      }

      const expression = this.#logicalExpression();
      const separatorToken = this.#match("separator");

      if (separatorToken === null) {
        const closeToken = this.#match("group-close");
        if (closeToken === null) {
          throw new RecoverableParserError(
            "parser.expected-group-close",
            PARSER_ERROR_MESSAGE_EXPECTED_GROUP_CLOSE,
            this.#lexer.peek() ?? undefined,
          );
        }
        const location = this.#encloseLocations(
          openToken.location,
          expression.location,
          closeToken.location,
        );

        return {
          ...expression,
          location,
        };
      }

      const items: LogicalExpression[] = [expression];
      let closeToken = this.#match("group-close");

      if (closeToken === null) {
        for (; ;) {
          items.push(this.#logicalExpression());

          if (!this.#match("separator")) break;
        }

        closeToken = this.#match("group-close");
        if (closeToken === null) {
          throw new RecoverableParserError(
            "parser.expected-group-close",
            PARSER_ERROR_MESSAGE_EXPECTED_GROUP_CLOSE,
            this.#lexer.peek() ?? undefined,
          );
        }
      }

      const location = this.#encloseLocations(
        openToken.location,
        separatorToken.location,
        ...items.map((item) => item.location),
        closeToken.location,
      );

      return {
        type: "value",
        value: { type: "list", items },
        location,
      };
    }

    throw new RecoverableParserError(
      "parser.expected-value",
      PARSER_ERROR_MESSAGE_EXPECTED_VALUE,
      this.#lexer.peek() ?? undefined,
    );
  }

  #matchAnyOf(types: TokenType[]): Token | null {
    const nextToken = this.#lexer.peek();

    if (nextToken === null || !types.includes(nextToken.type)) {
      return null;
    }

    this.#lexer.next();
    return nextToken;
  }

  #match(type: TokenType): Token | null {
    const nextToken = this.#lexer.peek();

    if (nextToken === null || nextToken.type !== type) {
      return null;
    }

    this.#lexer.next();
    return nextToken;
  }
}

const lookupOrThrow = <K extends string, V>(
  map: Partial<Record<K, V>>,
  key: K,
): V => {
  const value = map[key];
  if (value === undefined) {
    throw new RecoverableParserError(
      "parser.unknown-token-type",
      parserErrorMessageUnknownTokenType(key),
    );
  }
  return value;
};

const orOperatorMap = {
  "logical-or": "or",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const andOperatorMap = {
  "logical-and": "and",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const comparisonOperatorMap = {
  "more-than": "greater-than",
  "less-than": "less-than",
  "less-than-or-equal": "less-than-equal",
  "more-than-or-equal": "greater-than-equal",
  "not-equal": "not-equals",
  equals: "equals",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const bitOrOperatorMap = {
  "bit-or": "bit-or",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const bitXorOperatorMap = {
  "bit-xor": "bit-xor",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const bitAndOperatorMap = {
  "bit-and": "bit-and",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const bitShiftOperatorMap = {
  "shift-right": "bit-right-shift",
  "shift-left": "bit-left-shift",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const additionOperatorMap = {
  plus: "addition",
  minus: "subtraction",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const factorOperatorMap = {
  times: "multiplication",
  division: "division",
  modulus: "modulus",
} as const satisfies Partial<Record<TokenType, BinaryExpression["operator"]>>;

const unaryOperatorMap = {
  "logical-not": "not",
  complement: "bit-complement",
  minus: "negate",
  not: "not",
} as const satisfies Partial<Record<TokenType, UnaryExpression["operator"]>>;

const isSyncToken = (type: TokenType): boolean => {
  switch (type) {
    case "separator":
    case "group-close":
    case "logical-or":
    case "logical-and":
      return true;
  }
  return false;
};

export const PARSER_ERROR_MESSAGE_UNEXPECTED_TOKENS_AFTER_EXPRESSION =
  "Unexpected tokens after expression";

export const PARSER_ERROR_MESSAGE_FAILED_TO_PARSE_EXPRESSION =
  "Failed to parse expression";

export const PARSER_ERROR_MESSAGE_EXPECTED_COLON = "Expected colon";

export const PARSER_ERROR_MESSAGE_EXPECTED_IN_AFTER_NOT =
  "Expected in after not";

export const PARSER_ERROR_MESSAGE_EXPECTED_GROUP_CLOSE = "Expected group-close";

export const PARSER_ERROR_MESSAGE_EXPECTED_VALUE = "Expected value";

export const parserErrorMessageUnknownTokenType = (key: string): string =>
  `Unknown token type ${key}`;
