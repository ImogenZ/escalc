import { describe, expect, vi, it } from "vitest";
import { evaluate, evaluateSafe } from "../evaluate";
import { ParserError } from "../classes/parser";
import type {
  FunctionArgument,
  ExpressionFunction,
} from "../classes/standard-evaluator";

describe(evaluate, () => {
  it("uses parameters", () => {
    expect.assertions(1);

    const result = evaluate("1+ {1} + [2] + [3] + four", {
      params: new Map(
        Object.entries({
          "1": 4,
          "2": 5,
          "3": 6,
          four: 5,
        }),
      ),
    });

    expect(result).toBe(21);
  });

  it("stops on first parse issue by default", () => {
    expect.assertions(3);

    const result = evaluateSafe("(123 *)  10/");

    expect(result.type).toBe("error");
    expect((result as { error: unknown }).error).toBeInstanceOf(ParserError);

    const parserError = (result as unknown as { error: ParserError }).error;

    expect(parserError.errors).toHaveLength(1);
  });

  it("forwards stopOnFirstError to parser", () => {
    expect.assertions(3);

    const result = evaluateSafe("(123 *)  10/", {
      stopOnFirstError: false,
    });

    expect(result.type).toBe("error");
    expect((result as { error: unknown }).error).toBeInstanceOf(ParserError);

    const parserError = (result as unknown as { error: ParserError }).error;

    expect(parserError.errors.length).toBeGreaterThan(1);
  });

  it("uses functions", () => {
    expect.assertions(5);

    const func1 = vi.fn<ExpressionFunction>(() => 500);
    const options = {
      functions: new Map([["Func1", func1]]),
    };
    const result = evaluate("1 + Func1(1,2,3)", options);

    expect(func1).toHaveBeenCalledTimes(1);

    const [args] = func1.mock.calls[0] as [
      FunctionArgument[],
      unknown,
    ];

    expect(args).toHaveLength(3);
    expect(args.map((arg) => arg.expression)).toMatchObject([
      {
        type: "value",
        value: { type: "constant", value: { type: "number", value: "1" } },
      },
      {
        type: "value",
        value: { type: "constant", value: { type: "number", value: "2" } },
      },
      {
        type: "value",
        value: { type: "constant", value: { type: "number", value: "3" } },
      },
    ]);
    expect(args.every((arg) => typeof arg.evaluate === "function")).toBe(true);

    expect(result).toBe(501);
  });

  it.each([
    "1 < 2",
    "1 > 2",
    "1 <= 2",
    "1 >= 2",
    "1 = 2",
    "1 != 2",
    "1 <> 2",
    "true && false",
    "true and false",
    "true || false",
    "true or false",
    "1  in (1,)",
    "1 not in (1,)",
    "1 + 2",
    "1 - 2",
    "1 * 2",
    "1 / 2",
    "1 % 2",
    "1 ** 2",
    "()",
    "(1,)",
    "(1,2)",
    "!false",
    "!!false",
    "---1",
    "-1",
    "~1",
    "~~~~1",
    "1 | 2",
    "1 & 2",
    "1 ^ 2",
    "1 << 2",
    "1 >> 2",
  ])("simple %s", (expr) => {
    expect.assertions(1);
    expect(evaluate(expr)).toMatchSnapshot();
  });

  it("complex", () => {
    expect.assertions(1);

    const options = {
      params: new Map<string, unknown>(
        Object.entries({
          flagA: true,
          flagB: false,
          score: 1250,
          region: "EU",
          x1: 0.5,
          x2: 1,
          x3: 0.3,
          scaleFactor: 10,
          delta: 50,
          mean: 47.5,
          isVIP: true,
          bonus: 20,
          userLevel: 8,
          experience: 10000,
          temp: 55,
          val1: 2,
          val2: 3,
          val3: 4,
          val4: 5,
          divider: 4,
          group: "beta",
          t1: 10,
          t2: 11,
          t3: 12,
          t4: 13,
          t5: 14,
          t6: 15,
          d1: 20,
          d2: 5,
          d3: 10,
          e1: 2.5,
          e2: 4,
          x: 15,
          y: 3,
          z: 40,
          flagC: false,
          state: "active",
          role: "admin",
          accessLevel: 3,
          term1: 1,
          term2: 2,
          term3: 3,
          term4: 4,
          term5: 5,
          term6: 6,
          term7: 7,
          term8: 8,
          term9: 9,
          term10: 10,
          term11: 11,
          term12: 12,
          mass1: 10,
          accel1: 2,
          mass2: 15,
          accel2: 1.5,
          mass3: 5,
          accel3: 3,
          force1: 100,
          area1: 10,
          force2: 200,
          area2: 20,
          xPos1: 5,
          xPos2: 1,
          yPos1: 7,
          yPos2: 3,
          speed: 120,
          dangerLevel: 8,
          noise1: 2,
          noise2: 3,
          noise3: 5,
          signal1: 10,
          signal2: 5,
          env: "prod",
          retries: 1,
          timeout: 100,
          val_1: 1,
          val_2: 2,
          val_3: 3,
          val_4: 4,
          val_5: 5,
          val_6: 6,
          val_7: 7,
          val_8: 8,
          val_9: 9,
          val_10: 10,
        }),
      ),
    };

    expect(
      evaluate(
        String.raw`
(
                            if([flagA] && [flagB], 1, 0) +
                            if([score] > 1000, Pow([score], 0.5), [score] * 1.5) +
                            if([region] = 'EU', 50, 20) +
                            (Sin([x1]) + Cos([x2]) + Tan([x3])) * Log([scaleFactor] + 1, 10) +
                            Abs([delta] - [mean]) +
                            (if([isVIP], [bonus] * 3, [bonus])) +
                            ([userLevel] % 5) * Pow([experience], 0.33) +
                            if([temp] > 50, [temp] - 10, [temp] + 5) +
                            (
                              Pow([val1], 2) + Pow([val2], 2) + Pow([val3], 2) + Pow([val4], 2)
                            ) / Sqrt([divider] + 1) +
                            (
                              if([group] = 'alpha', 10, 0) +
                              if([group] = 'beta', 20, 0) +
                              if([group] = 'gamma', 30, 0)
                            ) +
                            (
                              ([t1] + [t2] + [t3] + [t4] + [t5] + [t6]) * 0.5 +
                              ([d1] - [d2] + [d3]) * 2 +
                              Log(Abs([e1] * [e2] + 1), 10)
                            ) +
                            (
                              if(([x] > 10 && [y] < 5) || ![flagC], [z] * 2, [z] / 2)
                            ) +
                            (
                              (if([state] = 'active', 1, 0) + if([role] = 'admin', 5, 1)) * [accessLevel]
                            ) +
                            (
                              [term1] + [term2] + [term3] + [term4] + [term5] + [term6] +
                              [term7] + [term8] + [term9] + [term10] + [term11] + [term12]
                            ) +
                            (
                              [mass1] * [accel1] + [mass2] * [accel2] + [mass3] * [accel3]
                            ) +
                            (
                              [force1] / ([area1] + 0.0001) + [force2] / ([area2] + 0.0001)
                            ) +
                            (
                              ([xPos1] - [xPos2])^2 + ([yPos1] - [yPos2])^2
                            ) +
                            (
                              if([speed] > 100, [dangerLevel] * 2, [dangerLevel] / 2)
                            ) +
                            (
                              ([noise1] + [noise2] + [noise3]) / ([signal1] + [signal2] + 1)
                            ) +
                            (
                              if([env] = 'prod' && [retries] < 3, [timeout] * 2, [timeout] / 2)
                            ) +
                            (
                              Pow([val_1],2) + Pow([val_2],2) + Pow([val_3],2) + Pow([val_4],2) +
                              Pow([val_5],2) + Pow([val_6],2) + Pow([val_7],2) + Pow([val_8],2) +
                              Pow([val_9],2) + Pow([val_10],2)
                            )
                          )

  `,
        options,
      ),
    ).toBeCloseTo(1244.734077454038, 3);
  });

  it("simple", () => {
    expect.assertions(1);

    const result = evaluate("11+22");

    expect(result).toBe(33);
  });
});
