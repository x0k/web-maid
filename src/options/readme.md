# Scraper Extension

Extension to scrape data from web pages in free form.

## Config

Config is a program which describes receiving endpoint and shape of data to send.

Example:

```yaml
request:
  method: POST
  url: https://api.example.com/notes
  headers:
    Content-Type: application/json
    Authorization:
      $op: get
      key: apiKey
  body:
    key1": value1
    key2": value2
```
