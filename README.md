
# Scraper Extension

Extension to scrape data from web pages in free form.

## Config

The `config` describes the receiving endpoints and the shape of data to send.

Example:

```yaml
- method: POST
  url: https://api.example.com/notes
  headers:
    Content-Type: application/json
    Authorization:
      $op: get
      key: token
  body:
    content:
      title:
        $op: document
        key: title
      url:
        $op: document
        key:
          - location
          - href
      html:
        $op: document
        key:
          - documentElement
          - outerHTML
      selection:
        $op: selection
```

The entire `config` is a program that is computed using the following rules:

- If an object contains the key `$op`, it is interpreted as an `operator`, the other keys of this object are parameters of the `operator`
- Operators transform the `context` according to their logic and specified parameters
- Rest values interprets as is
- Calculation is a depth-first search
- Initial `context` is a `secrets` data

## Secrets

The data which contains sensitive information and stored locally.

Secrets data from [config](#config) section.

```yaml
token: secret
```

## Operators

Operators are functions with the following signature

```typescript
type Operator<C, R> = (config: C) => (context: unknown) => R
```

## Additional

You can define `schema` and `uiSchema` in the `body` section to validate, supplement, or edit the information to sent.
