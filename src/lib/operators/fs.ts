import { z } from "zod";
import mime from "mime";
import { fileOpen, fileSave } from "browser-fs-access";

import { TaskOpFactory } from "@/lib/operator";
import { AsyncFactory } from "@/lib/factory";
import { neverError } from "@/lib/guards";

const saveConfig = z.object({
  filename: z.string(),
  content: z.string(),
  mimeType: z.string().optional(),
  saver: z.enum(["native", "extension"]).default("native"),
});

export interface DownloaderData {
  content: string
  filename: string
  type: string
}

export class SaveFileOpFactory extends TaskOpFactory<
  typeof saveConfig,
  string
> {
  name = "saveFile";
  readonly schema = saveConfig;

  constructor(
    private readonly okShower: AsyncFactory<string, void>,
    private readonly downloader: AsyncFactory<DownloaderData, void>
  ) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  filename: string
  content: string
  mimeType?: string
  /** @default "native" */
  saver?: "native" | "extension"
}`,
          returns: `string`,
          description:
            "Trigger a file save dialog if possible. Otherwise, shows a download button. \
If `mimeType` is not provided, it will be guessed from `filename`. \
Returns the `filename`.",
        },
      ];
    }
  }

  protected async execute({
    filename,
    content,
    mimeType,
    saver,
  }: z.TypeOf<this["schema"]>): Promise<string> {
    const type = mimeType ?? mime.getType(filename);
    if (!type) {
      throw new Error(`Could not determine mime type for ${filename}`);
    }
    try {
      switch (saver) {
        case "native":
          await fileSave(new Blob([content], { type }), {
            fileName: filename,
          });
          break;
        case "extension":
          await this.downloader.Create({
            type,
            filename,
            content,
          });
          break;
        default:
          throw neverError(saver, "Invalid saver");
      }
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
  name = "openFile";
  readonly schema = openConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  extensions?: string[]
  description?: string
  mimeTypes?: string[]
}`,
          returns: `string`,
          description:
            "Open a file dialog. \
Returns the content of the selected file as string.",
        },
      ];
    }
  }
  protected async execute(options: z.TypeOf<this["schema"]>): Promise<string> {
    const blob = await fileOpen(options);
    return await blob.text();
  }
}

export function fsOperatorsFactories(
  okShower: AsyncFactory<string, void>,
  downloader: AsyncFactory<DownloaderData, void>,
) {
  return [
    new SaveFileOpFactory(okShower, downloader),
    new OpenFileOpFactory(),
  ];
}
