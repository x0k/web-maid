# Operators

List of all available operators.

The operators signatures are described in `typescript`-like syntax with the following features:

- `<context>` is a context of operator
- `<json>` is a value that can be properly serialized to JSON. With the following comparison rules:
  - `null < boolean < number < string < array < object`
  - If `objects` have the same count of keys:
    - If keys are different, then `object` with the greatest uniq key is greater
    - If keys are the same, values are compared in alphabetical order of keys

Also the truthiness and falseness of the values is the same as in JavaScript.

## Operator `pipe`

### Signatures

Passes the result of the previous `operator` as the `context` to the next `operator`

```typescript
interface Config<R> {
  do: R[]
}
```

**Returns:**

```typescript
R
```

### Examples

Basic usage

```yaml
$op: pipe
do:
  - key: value
  - $op: get
    key: key

```

**Result:**

```yaml
value
```

## Operator `and`

### Signatures

Evaluates conditions one by one.
If any of the conditions fails, returns the result of the failed condition,
otherwise returns the result of the last condition.

```typescript
interface Config<R> {
  conditions: R[]
}
```

**Returns:**

```typescript
R
```

### Examples

Basic usage

```yaml
$op: and
conditions:
  - true
  - string
  - 0
  - null
```

**Result:**

```yaml
0
```

## Operator `or`

### Signatures

Evaluates conditions one by one.
If any of the conditions succeeds, returns the result of the succeeded condition,
otherwise returns the result of the last condition.

```typescript
interface Config<R> {
  conditions: R[]
}
```

**Returns:**

```typescript
R
```

### Examples

Basic usage

```yaml
$op: or
conditions:
  - 0
  - null
  - string
  - true
```

**Result:**

```yaml
string
```

## Operator `not`

### Signatures

Takes truthy values to `false` and falsy values to `true`

```typescript
interface NotConfig {
  value: any;
}
```

**Returns:**

```typescript
boolean
```

### Examples

Basic usage

```yaml
$op: not
value: some value
```

**Result:**

```yaml
false
```

## Operator `if`

### Signatures

Returns `then` if `condition` is truthy, otherwise `else`. If `condition` is falsy and `else` is not provided, returns `null`.

```typescript
interface IfConfig<T, E> {
  condition: any;
  then: T;
  /** @default null */
  else?: E | null;
}
```

**Returns:**

```typescript
T | E | null
```

### Examples

Basic usage

```yaml
$op: if
condition: false
then: next value
```

**Result:**

```yaml
null
```

## Operator `cond`

### Signatures

Evaluates `conditions` in order until one returns truthy and returns the `then` value.

- If none of the `conditions` return truthy and `default` is provided, returns `default`.- If none of the `conditions` return truthy and `default` is not provided, throws an error.

```typescript
interface Config<R> {
  cases: [condition: any, then: R][];
  default?: R;
}
```

**Returns:**

```typescript
R
```

### Examples

Basic usage

```yaml
$op: cond
cases:
  - [false, falsy]
  - [true, truthy]
default: default
```

**Result:**

```yaml
truthy
```

## Operator `lt`

### Signatures

Returns `true` if `left` is less than `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `lte`

### Signatures

Returns `true` if `left` is less than or equal to `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `gt`

### Signatures

Returns `true` if `left` is greater than `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `gte`

### Signatures

Returns `true` if `left` is greater than or equal to `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `eq`

### Signatures

Returns `true` if `left` is equal to `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `neq`

### Signatures

Returns `true` if `left` is not equal to `right`.

```typescript
interface Config {
  left: <json>;
  right: <json>;
}
```

**Returns:**

```typescript
boolean
```

## Operator `get`

### Signatures

Returns the current context

```typescript
interface Config {}
```

**Returns:**

```typescript
<context>
```

Returns `from[key]` if it exists, otherwise returns `default` if provided, otherwise throws an error

```typescript
interface Config {
  key: string;
  from: Record<string, unknown>;
  default?: any;
}
```

**Returns:**

```typescript
unknown
```

Returns `from[key]` if it exists, otherwise returns `default` if provided, otherwise throws an error

```typescript
interface Config {
  key: number;
  from: Array<unknown>;
  default?: any;
}
```

**Returns:**

```typescript
unknown
```

Retrieves a value from nested objects, if it exist, otherwise returns `default` if provided, otherwise throws an error

```typescript
type From = Record<string, unknown | From> | Array<unknown | From>
interface Config {
  key: Array<string | number>;
  from: From
  default?: any;
}
```

**Returns:**

```typescript
unknown
```

### Examples

Returns current context

```yaml
$op: get
```

**Result:**

```yaml
<context>
```

Returns nested value

```yaml
$op: get
key:
  - some
  - nested
from:
  some:
    nested: value
```

**Result:**

```yaml
value
```

## Operator `update`

### Signatures

Updates `source` array with `properties`

```typescript
interface Config<T> {
  source?: Array<T>
  properties: Record<number, T>;
}
```

**Returns:**

```typescript
Array<T>
```

Updates `source` object with `properties`

```typescript
interface Config<T> {
  source?: Record<string, T>
  properties: Record<string, T>;
}
```

**Returns:**

```typescript
Record<string, T>
```

### Examples

Updates array

```yaml
$op: update
source: [1, 2, 3]
properties:
  1: 10
```

**Result:**

```yaml
[1, 10, 3]
```

Updates object

```yaml
$op: update
source: { a: 1, b: 2 }
properties:
  a: 10
```

**Result:**

```yaml
{ a: 10, b: 2 }
```

## Operator `try`

### Signatures

Catches and handles runtime errors. Works as follows:

- Executes `do` block, returned value is rewritten as `context`
  - If it fails, an error is stored in `scope`
    - If `catch` block is provided, it is executed, returned value is rewritten as `context`
- If `finally` block is provided, it is executed, returned value is rewritten as `context`
- If an error is occurred and `catch` block is not provided or it crashes, an error is thrown
- If no error is occurred, the `context` is returned

```typescript
interface TryConfig<R, C, F> {
  do: R;
  catch?: C;
  finally?: F;
}
```

**Returns:**

```typescript
 R | C | F
```

### Examples

Catches and handles runtime errors

```yaml
$op: try
do:
  $op: throw
  error: "some error"
catch: 1
finally:
  $op: plus
  left:
    $op: get
  right: 1
```

**Result:**

```yaml
2
```

## Operator `throw`

### Signatures

Throws a runtime error

```typescript
interface ThrowConfig {
  error: any;
}
```

**Returns:**

```typescript
never
```

## Operator `do`

### Signatures

Performs a side effect and returns the original `context`

```typescript
interface DoConfig {
  effect: any;
}
```

**Returns:**

```typescript
<context>
```

## Operator `plus`

### Signatures

Returns the sum of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `minus`

### Signatures

Returns the difference of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `mul`

### Signatures

Returns the product of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `div`

### Signatures

Returns the quotient of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `mod`

### Signatures

Returns the remainder of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `pow`

### Signatures

Returns the power of `left` and `right`.

```typescript
interface Config {
  left: number;
  right: number;
}
```

**Returns:**

```typescript
number
```

## Operator `array.index`

### Signatures

Returns the `index` of the current element in the processed `array`.Throws an error if called outside `array` method.

```typescript
interface Config {}
```

**Returns:**

```typescript
number
```

## Operator `array.current`

### Signatures

Returns the current `array`.Throws an error if called outside `array` method.

```typescript
interface Config {}
```

**Returns:**

```typescript
unknown[]
```

## Operator `array.find`

### Signatures

Finds an element in an array that matches the predicate. Returns `null` if not found.

```typescript
interface Config {
  source?: unknown[]
  predicate: (value: unknown) => unknown
}
```

**Returns:**

```typescript
unknown | null
```

### Examples

Basic usage

```yaml
$op: array.find
source: [1, 2, 3]
predicate:
  $op: eq
  left: 2
  right:
    $op: get
```

**Result:**

```yaml
2
```

## Operator `sys.define`

### Signatures

Defines a `functions` and/or `constants`. If `function` or `constant` already exists in `scope` it will be overwritten. Definition affects only `scope` that passes for evaluation `for` key.

```typescript
interface Config<R> {
  functions?: Record<string, any>;
  constants?: Record<string, any>;
  for: R;
}
```

**Returns:**

```typescript
R
```

### Examples

Override scope

```yaml
$op: sys.define
constants:
  const: 1
for:
  $op: sys.define
  constants:
    const: 2
  for:
    $op: plus
    left:
      $op: sys.get
      key: const
    right: 2
```

**Result:**

```yaml
4
```

## Operator `sys.call`

### Signatures

Calls a `function` and returns its result.

```typescript
interface Config {
  fn: string
  arg?: any
}
```

**Returns:**

```typescript
unknown
```

### Examples

Basic usage

```yaml
$op: sys.define
functions:
  add10:
    $op: plus
    left:
      $op: get
    right: 10
for:
  $op: sys.call
  fn: add10
  arg: 5
```

**Result:**

```yaml
15
```

## Operator `sys.get`

### Signatures

Returns a `constant` from a current `scope`. If `constant` is not defined then `default` value is returned. If `default` is not defined then an error is thrown.

```typescript
interface Config {
  key: string
  default?: any
}
```

**Returns:**

```typescript
unknown
```

## Operator `sys.exec`

### Signatures

Executes an `operator` and returns its result. Can be used to execute `operators` with computed `config`.

```typescript
interface Config {
  op: string;
  config?: Record<string, any>;
  arg?: any;
}
```

**Returns:**

```typescript
unknown
```

### Examples

Basic usage

```yaml
$op: pipe
do:
  - key: key2
    key2: value
  - $op: sys.exec
    op: get
    config:
      $op: get
```

**Result:**

```yaml
value
```

## Operator `sys.eval`

### Signatures

Evaluates an expression on the current `scope` and returns its result.

```typescript
interface Config {
  expression: any;
}
```

**Returns:**

```typescript
unknown
```

### Examples

Basic usage

```yaml
$op: pipe
do:
  - val
  - $op: sys.eval
    expression:
      $op: json.parse
      value: "{\"$op\": \"get\"}"
```

**Result:**

```yaml
val
```

## Operator `sys.err`

### Signatures

Returns a last caught by `try` operator stringified error in the current `scope`.

```typescript
interface Config {}
```

**Returns:**

```typescript
string
```

## Operator `template.render`

### Signatures

Renders handlebars `template` with `data`.

```typescript
interface RenderConfig {
  template: string;
  data?: unknown;
}
```

**Returns:**

```typescript
string
```

### Examples

Basic usage

```yaml
$op: template.render
template: |
  Hello, {{name}}!
data:
  name: John
```

**Result:**

```yaml
Hello, John!
```

## Operator `doc.get`

### Signatures

Returns a value from `document` and validates it as `<json>`. Follows the same rules as `get` operator.

```typescript
interface Config {
  key: string | number | (string | number)[];
  default?: unknown;
}
```

**Returns:**

```typescript
<json>
```

### Examples

Get document title

```yaml
$op: doc.get
key: title
```

**Result:**

```yaml
<current document title>
```

Get current URL

```yaml
$op: doc.get
key:
  - location
  - href
```

**Result:**

```yaml
<current document URL>
```

Get document HTML

```yaml
$op: doc.get
key:
  - documentElement
  - outerHTML
```

**Result:**

```yaml
<current document HTML>
```

## Operator `doc.eval`

### Signatures

Evaluates an javascript expression and returns its result. Since the `eval` is blocked by CSP, evaluation is performed in an isolated sandbox. If during the execution of the expression an error occurs, the `default` value is returned.

There are several ways to inject `data` into the expression:

- `context` - the provided `data` will be available by `this` keyword.
- `scope` - the values of provided `data` will be implicitly available in the expression.

```typescript
interface Config {
  expression: string
  /** @default {} */
  data?: unknown
  /** @default "context" */
  injectAs?: "context" | "scope"
  default?: any
}
```

**Returns:**

```typescript
unknown
```

### Examples

Inject as context

```yaml
$op: doc.eval
expression: this.key + 1
data:
  key: 1
```

**Result:**

```yaml
2
```

Inject as scope

```yaml
$op: doc.eval
expression: key + 1
injectAs: scope
data:
  key: 1
```

**Result:**

```yaml
2
```

## Operator `doc.selection`

### Signatures

Returns the selection of current document in `text` or `html` format. If the selection is empty, the `default` value is returned.

```typescript
interface Config<D> {
  /** @default "text" */
  as?: "text" | "html";
  /** @default "" */
  default?: D | string;
}
```

**Returns:**

```typescript
D | string
```

## Operator `html.readability`

### Signatures

Returns an article object.

```typescript
interface Config<D> {
  html: string;
  baseUrl?: string;
  /** @default "" */
  default?: D | string;
}
```

**Returns:**

```typescript
{
  /** article title */
  title: string;
  /** HTML string of processed article content */
  content: T;
  /** text content of the article, with all the HTML tags removed */
  textContent: string;
  /** length of an article, in characters */
  length: number;
  /** article description, or short excerpt from the content */
  excerpt: string;
  /** author metadata */
  byline: string;
  /** content direction */
  dir: string;
  /** name of the site */
  siteName: string;
  /** content language */
  lang: string;
  /** published time */
  publishedTime: string;
} | D | string"
```

## Operator `html.simplify`

### Signatures

Returns a content of article object.

```typescript
interface Config<D> {
  html: string;
  baseUrl?: string;
  default?: D | string;
}
```

**Returns:**

```typescript
D | string
```

## Operator `html.markdown`

### Signatures

Converts HTML to Markdown.

```typescript
interface Config {
  html: string;
  /** @default {
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  } */
  options?: {
    headingStyle?: "setext" | "atx" | undefined;
    hr?: string | undefined;
    br?: string | undefined;
    bulletListMarker?: "-" | "+" | "*" | undefined;
    codeBlockStyle?: "indented" | "fenced" | undefined;
    emDelimiter?: "_" | "*" | undefined;
    fence?: "```" | "~~~" | undefined;
    strongDelimiter?: "__" | "**" | undefined;
    linkStyle?: "inlined" | "referenced" | undefined;
    linkReferenceStyle?: "full" | "collapsed" | "shortcut" | undefined;
  }
}
```

**Returns:**

```typescript
string
```

## Operator `html.metadata`

### Signatures

Returns a HTML page metadata.

```typescript
interface Config {
  html: string
}
```

**Returns:**

```typescript
{
  title: string | null
  description: string | null
  modifiedDate: string | null
  publishedDate: string | null
  date: string | null
  image: string | null
  author: string | null
}
```

## Operator `str.join`

### Signatures

Joins an array of strings.

```typescript
interface Config {
  values: string[]
  /** @default "" */
  separator?: string
}
```

**Returns:**

```typescript
string
```

## Operator `str.replace`

### Signatures

Replaces `pattern` with `replacement`

```typescript
interface Config {
  value: string
  pattern: string
  replacement: string
}
```

**Returns:**

```typescript
string
```

## Operator `str.replaceByRegExp`

### Signatures

Replaces global regexp `pattern` with `replacement`

```typescript
interface Config {
  value: string
  pattern: string
  replacement: string
}
```

**Returns:**

```typescript
string
```

## Operator `str.match`

### Signatures

Returns an array of matches of `pattern` in `value` with `flags`.
Behaves like `javascript` `String.prototype.match` or `String.prototype.matchAll` when `all` is `true.

```typescript
interface Config {
  value: string
  pattern: string
  flags?: string
  all?: boolean
}
```

**Returns:**

```typescript
null | string[] | string[][]
```

## Operator `str.split`

### Signatures

Splits `value` by `separator`

```typescript
interface Config {
  value: string
  separator: string
  limit?: number
}
```

**Returns:**

```typescript
string[]
```

## Operator `str.splitByRegExp`

### Signatures

Splits `value` by regexp `separator`

```typescript
interface Config {
  value: string
  separator: string
  limit?: number
}
```

**Returns:**

```typescript
string[]
```

## Operator `str.search`

### Signatures

Returns the index of the first match of `pattern` in `value` with `flags`

```typescript
interface Config {
  value: string
  pattern: string
  flags?: string
}
```

**Returns:**

```typescript
number
```

## Operator `fs.saveFile`

### Signatures

Trigger a file save dialog if possible. Otherwise, shows a download button. If `mimeType` is not provided, it will be guessed from `filename`. Returns the `filename`.

```typescript
interface Config {
  filename: string
  content: string
  mimeType?: string
}
```

**Returns:**

```typescript
string
```

## Operator `fs.openFile`

### Signatures

Open a file dialog. Returns the content of the selected file as string.

```typescript
interface Config {
  extensions?: string[]
  description?: string
  mimeTypes?: string[]
}
```

**Returns:**

```typescript
string
```

## Operator `json.stringify`

### Signatures

Converts a `<json>` value to a JSON string.

```typescript
interface Config {
  value: <json>
}
```

**Returns:**

```typescript
string
```

## Operator `json.parse`

### Signatures

Parses a JSON string.

```typescript
interface Config {
  value: string
}
```

**Returns:**

```typescript
<json>
```

## Operator `jsonSchema.validate`

### Signatures

Validates a `<json>` value against a provided JSON schema.

```typescript
interface Config {
  schema: Record<string, unknown>
  data: <json>
}
```

**Returns:**

```typescript
boolean
```

## Operator `jsonSchema.form`

### Signatures

Shows a form constructed from a provided JSON and UI schemas. It returns a `<json>` value of the form after the form is submitted.

```typescript
interface Config {
  schema: Record<string, unknown>
  uiSchema?: Record<string, unknown>
  data?: <json>
  omitExtraData?: boolean
}
```

**Returns:**

```typescript
<json>
```

## Operator `dbg.log`

### Signatures

Prints a log message to the console

```typescript
interface LogConfig {
  label?: string
  value?: any
}
```

**Returns:**

```typescript
<context>
```

### Examples

Prints a current `context`

```yaml
$op: dbg.log
```

**Result:**

```yaml
<context>
```

Prints specified value with provided label

```yaml
$op: dbg.log
label: "token"
value:
  $op: get
  key: token
```

**Result:**

```yaml
<context>
```

## Operator `http.request`

### Signatures

Makes a fetch request. If `as` parameter is not provided, the result type will be determined by the `Content-Type` header.

```typescript
interface Config {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  as?: "json" | "text"
}
```

**Returns:**

```typescript
<json> | string
```