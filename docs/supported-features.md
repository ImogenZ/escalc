# Supported Features

## Operators

### Arithmetic

| Syntax   | Name           | Types    | Example          |
| -------- | -------------- | -------- | ---------------- |
| `a + b`  | Addition       | `number` | `1 + 2` → `3`    |
| `a - b`  | Subtraction    | `number` | `5 - 3` → `2`    |
| `a * b`  | Multiplication | `number` | `4 * 3` → `12`   |
| `a / b`  | Division       | `number` | `10 / 4` → `2.5` |
| `a % b`  | Modulo         | `number` | `10 % 3` → `1`   |
| `a ** b` | Exponentiation | `number` | `2 ** 8` → `256` |

### Comparison

| Syntax   | Name                  | Types                                 | Example               |
| -------- | --------------------- | ------------------------------------- | --------------------- |
| `a > b`  | Greater-than          | `number`, `Date`                      | `3 > 2` → `true`      |
| `a < b`  | Less-than             | `number`, `Date`                      | `2 < 3` → `true`      |
| `a >= b` | Greater-than-or-equal | `number`, `Date`                      | `3 >= 3` → `true`     |
| `a <= b` | Less-than-or-equal    | `number`, `Date`                      | `2 <= 3` → `true`     |
| `a == b` | Equals                | `number`, `boolean`, `string`, `Date` | `'a' == 'a'` → `true` |
| `a != b` | Not-equals            | `number`, `boolean`, `string`, `Date` | `1 != 2` → `true`     |

### Logical

| Syntax     | Name | Behaviour                                                     |
| ---------- | ---- | ------------------------------------------------------------- |
| `a && b`   | AND  | Short-circuits: right side not evaluated when left is `false` |
| `a \|\| b` | OR   | Short-circuits: right side not evaluated when left is `true`  |
| `!a`       | NOT  | `boolean`                                                     |

### Bitwise

| Syntax   | Name        | Types    |
| -------- | ----------- | -------- |
| `a & b`  | Bitwise AND | `number` |
| `a \| b` | Bitwise OR  | `number` |
| `a ^ b`  | Bitwise XOR | `number` |
| `a << b` | Left shift  | `number` |
| `a >> b` | Right shift | `number` |
| `~a`     | Complement  | `number` |

### Membership

| Syntax          | Description                                 | Example                       |
| --------------- | ------------------------------------------- | ----------------------------- |
| `a in list`     | Element is in array, or substring in string | `2 in (1, 2, 3)` → `true`     |
| `a not in list` | Negation of `in`                            | `'x' not in 'hello'` → `true` |

### Ternary

```
condition ? trueValue : falseValue
```

```ts
evaluate('1 > 0 ? "yes" : "no"'); // => 'yes'
```

### Unary negation

```ts
evaluate("-[x]", { params: new Map([["x", 5]]) }); // => -5
```

---

## Value types

| Type      | Syntax examples              | JavaScript type              |
| --------- | ---------------------------- | ---------------------------- |
| Number    | `42`, `3.14`, `1.5e-3`, `-7` | `number`                     |
| Boolean   | `true`, `false`              | `boolean`                    |
| String    | `'hello'`, `'it\'s'`         | `string`                     |
| Date      | `#2024-01-15#`               | `Date`                       |
| Parameter | `[name]`, `{name}`           | Supplied via `params`        |
| List      | `(1, 2, 3)`                  | `unknown[]` (used with `in`) |

### String escape sequences

| Sequence | Meaning         |
| -------- | --------------- |
| `\\`     | Backslash       |
| `\'`     | Single quote    |
| `\n`     | Newline         |
| `\t`     | Tab             |
| `\r`     | Carriage return |

---

## Built-in functions

### Mathematical functions

All mathematical functions accept `number` arguments and return `number`.

| Function              | Description                                      |
| --------------------- | ------------------------------------------------ |
| `Abs(x)`              | Absolute value                                   |
| `Acos(x)`             | Arc cosine (radians)                             |
| `Asin(x)`             | Arc sine (radians)                               |
| `Atan(x)`             | Arc tangent (radians)                            |
| `Ceiling(x)`          | Round up to nearest integer                      |
| `Cos(x)`              | Cosine (radians)                                 |
| `Exp(x)`              | `e` to the power of `x`                          |
| `Floor(x)`            | Round down to nearest integer                    |
| `IEEERemainder(x, y)` | IEEE 754 remainder: `x - y * Round(x/y)`         |
| `Ln(x)`               | Natural logarithm                                |
| `Log(x)`              | Natural logarithm (1 arg) or `log_y(x)` (2 args) |
| `Log10(x)`            | Base-10 logarithm                                |
| `Max(x, y)`           | Larger of two numbers                            |
| `Min(x, y)`           | Smaller of two numbers                           |
| `Pow(x, y)`           | `x` to the power of `y`                          |
| `Round(x)`            | Round to nearest integer                         |
| `Round(x, digits)`    | Round to `digits` decimal places                 |
| `Sign(x)`             | `-1`, `0`, or `1`                                |
| `Sin(x)`              | Sine (radians)                                   |
| `Sqrt(x)`             | Square root                                      |
| `Tan(x)`              | Tangent (radians)                                |
| `Truncate(x)`         | Remove fractional part (towards zero)            |

### Conditional functions

| Function                                      | Description                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `if(condition, trueValue, falseValue)`        | Returns `trueValue` when `condition` is `true`, otherwise `falseValue`. Arguments are lazily evaluated.                                                      |
| `ifs(cond1, val1, cond2, val2, ..., default)` | Evaluates condition/value pairs in order. Returns the value of the first truthy condition, or `default` if none match. Must have an odd number of arguments. |

---

## NCalc compatibility matrix

| Feature                                  | Status             | Notes                                                       |
| ---------------------------------------- | ------------------ | ----------------------------------------------------------- |
| Arithmetic operators                     | ✅ Supported       |                                                             |
| Comparison operators                     | ✅ Supported       |                                                             |
| Logical operators (`&&` `\|\|` `!`)      | ✅ Supported       | Short-circuit evaluation                                    |
| Bitwise operators                        | ✅ Supported       |                                                             |
| Ternary operator                         | ✅ Supported       |                                                             |
| `in` / `not in`                          | ✅ Supported       |                                                             |
| String literals                          | ✅ Supported       |                                                             |
| Number literals (int, float, scientific) | ✅ Supported       |                                                             |
| Boolean literals                         | ✅ Supported       |                                                             |
| Date literals `#YYYY-MM-DD#`             | ✅ Supported       |                                                             |
| Parameter references `[name]` `{name}`   | ✅ Supported       |                                                             |
| List values `(a, b, c)`                  | ✅ Supported       | For use with `in`                                           |
| Built-in math functions                  | ✅ Supported       | See table above                                             |
| `if` / `ifs` conditional functions       | ✅ Supported       |                                                             |
| Custom functions                         | ✅ Supported       | Via `functions` option                                      |
| Lazy parameters                          | ✅ Supported       | Via `lazyParams` option                                     |
| Result caching                           | ❌ Won't implement | Cache at the call site in a way that suits your application |
| GUID value type                          | ❌ Won't implement | Use a string parameter                                      |
| Lambda expressions                       | ❌ Not supported   |                                                             |
