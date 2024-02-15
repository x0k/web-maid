import mime from "mime";

import { AsyncFactory } from "@/lib/factory";
import { FetcherData } from "@/lib/operators/http";

export class Fetcher implements AsyncFactory<FetcherData, unknown> {
  async Create({
    url,
    as,
    body,
    headers,
    method,
  }: FetcherData): Promise<unknown> {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    if (as === "dataUrl") {
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob)
      });
    }
    if (as) {
      return response[as]();
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType) {
      return response.text();
    }
    const ext = mime.getExtension(contentType);
    switch (ext) {
      case "json":
        return response.json();
      default:
        return response.text();
    }
  }
}
