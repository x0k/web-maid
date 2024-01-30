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

## Refs

If you need to include code from other files, you can use the `$ref` key.

Example:

```yaml
$ref: "./<filename>#<selector>"
```

- `<filename>` is the name of the file
- `<selector>` is [JSONPath](https://github.com/dchester/jsonpath) selector
- One of the parameters can be omitted (e.g. `./<filename>`, `#<selector>`)

## Examples

- [Save web content to Obsidian](examples/obsidian/)
- [Render json as a table](examples/json-to-table/)

## Things to do before release 1.x

- Configure Vite to create a separate injection script instead of `content_script`
- Think about a name for the project

## See also

- If you need a simple tool to save web content to Obsidian, try [obsidian-web](https://github.com/coddingtonbear/obsidian-web).
- Simple build automation tool [mk](https://github.com/x0k/mk)
