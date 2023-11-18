import { z } from "zod";
import mime from "mime";
import { fileOpen, fileSave } from "browser-fs-access";

import { TaskOpFactory } from "@/lib/operator";
import { AsyncFactory } from "../factory";

const saveConfig = z.object({
  filename: z.string(),
  content: z.string(),
  mimeType: z.string().optional(),
});

export class SaveFileOpFactory extends TaskOpFactory<
  typeof saveConfig,
  string
> {
  readonly schema = saveConfig;

  constructor(private readonly okShower: AsyncFactory<string, void>) {
    super();
  }

  protected async execute({
    filename,
    content,
    mimeType,
  }: z.TypeOf<this["schema"]>): Promise<string> {
    const type = mimeType ?? mime.getType(filename);
    if (!type) {
      throw new Error(`Could not determine mime type for ${filename}`);
    }
    try {
      await fileSave(new Blob([content], { type }), {
        fileName: filename,
      });
    } catch (error) {
      // Failed to execute 'showSaveFilePicker' on 'Window': Must be handling a user gesture to show a file picker.
      if (error instanceof DOMException && error.name === "SecurityError") {
        await this.okShower.Create(`Download "${filename}"`);
        await fileSave(new Blob([content], { type }), {
          fileName: filename,
        });
      } else {
        throw error;
      }
    }
    return filename;
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

export function fsOperatorsFactories(okShower: AsyncFactory<string, void>) {
  return {
    saveFile: new SaveFileOpFactory(okShower),
    openFile: new OpenFileOpFactory(),
  };
}
