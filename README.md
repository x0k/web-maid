# Scraper Extension

Extension to scrape data from web pages in free form.

## Config

Example:

```yaml
$op: pipe
do:
  - title:
      $op: doc.get
      key: title
    url:
      $op: doc.get
      key:
        - location
        - href
    text:
      $op: html.markdown
      html:
        $op: html.simplify
        html:
          $op: doc.get
          key:
            - documentElement
            - outerHTML
  - $op: fs.saveFile
    filename:
      $op: str.join
      values:
        - $op: get
          key: title
        - ".md"
    content:
      $op: template.render
      template: |
        ---
        title: {{title}}
        url: {{url}}
        ---

        {{text}}
```

The `config` is a program that is computed using the following rules:

- If an object contains the key `$op`, it is interpreted as an `operator`, the other keys of this object are parameters of the `operator`
- Operators transform the `context` according to their logic and specified parameters
- Rest values interprets as is
- Calculation is a depth-first search
- Initial `context` is a `secrets` data

## Secrets

The data which contains sensitive information and stored locally.

Example of `secrets` data:

```yaml
token: Bearer token
```

## Operators

Full documentation of operators is available in the [operators](docs/operators.md) section and on the `options` page of the extension.
