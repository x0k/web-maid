import { z } from "zod";
import { lookup } from "mrmime";
import { fileOpen, fileSave } from "browser-fs-access";

import { TaskOpFactory } from "@/lib/operator";

const saveConfig = z.object({
  fileName: z.string(),
  content: z.string(),
});

export class SaveFileOpFactory extends TaskOpFactory<
  typeof saveConfig,
  string
> {
  readonly schema = saveConfig;
  protected async execute({
    fileName,
    content,
  }: z.TypeOf<this["schema"]>): Promise<string> {
    const type = lookup(fileName);
    if (!type) {
      throw new Error(`Could not determine mime type for ${fileName}`);
    }
    await fileSave(new Blob([content], { type }));
    return fileName;
  }
}

const openConfig = z.object({
  extensions: z.array(z.string()).optional(),
  description: z.string().optional(),
  mimeTypes: z.array(z.string()).optional(),
});

export class OpenFileOpFactory extends TaskOpFactory<
  typeof openConfig,
  string
> {
  readonly schema = openConfig;
  protected async execute(options: z.TypeOf<this["schema"]>): Promise<string> {
    const blob = await fileOpen(options);
    return await blob.text();
  }
}

export function fsOperatorsFactories() {
  return {
    saveFile: new SaveFileOpFactory(),
    openFile: new OpenFileOpFactory(),
  };
}
