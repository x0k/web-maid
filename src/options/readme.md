# Operators

List of all available operators.

Signatures are described in `typescript` with following exceptions:

- `<context>` is a context of operator
- `<json>` is a value that can be properly serialized to JSON. With the following comparison rules:
  - `null < boolean < number < string < array < object`
  - If `objects` have the same count of keys:
    - If keys are different, then `object` with the greatest uniq key is greater
    - If keys are the same, values are compared in alphabetical order of keys
