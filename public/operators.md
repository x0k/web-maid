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
