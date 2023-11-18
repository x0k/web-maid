# Operators

## dbg

### dbg.log

#### Signature

```typescript
interface LogConfig {
  label?: string
  value?: any
}
function log ({ label = "log", value = context }: LogConfig):
  <C>(context: C) => C
```

#### Description

Prints a message to the console.

#### Examples

- Prints a current context

```yaml
$op: dbg.log
```

Prints specified value with provided label

```yaml
$op: dbg.log
label: "token"
value:
  $op: get
  key: token
```
