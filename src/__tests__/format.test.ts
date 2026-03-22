import { describe, expect, it } from "vitest";
import { format } from "../format";
import { parse } from "../parse";

describe(format, () => {
  it("reflexivity", () => {
    expect.assertions(1);

    const expression = "1 + 2";
    const formatted = format(parse(expression));

    expect(formatted).toBe(expression);
  });
});
