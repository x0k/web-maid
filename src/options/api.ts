import { nanoid } from "nanoid";

import { IRemoteActor, RemoteActor } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";

import { ConfigRenderedData, Extension } from "@/shared/extension";
import { Action, ActionResults, ActionType } from "@/shared/rpc";
import { DevSandbox } from '@/shared/dev-sandbox';

export class ConfigRendered
  implements AsyncFactory<ConfigRenderedData, string>
{
  constructor(private readonly actor: IRemoteActor<Action, ActionResults>) {}
  Create(config: ConfigRenderedData): Promise<string> {
    return this.actor.call({
      id: nanoid(),
      type: ActionType.RenderTemplate,
      template: config.configTemplate,
      data: config.configData,
    });
  }
}

let sandbox: IRemoteActor<Action, ActionResults>;
if (import.meta.env.DEV) {
  sandbox = new DevSandbox();
} else {
  const iFrame = document.getElementById("sandbox") as HTMLIFrameElement;
  iFrame.src = chrome.runtime.getURL("sandbox.html");
  const actor = new RemoteActor<Action, ActionResults, string>(iFrame);
  actor.listen(window);
  sandbox = actor;
}

const configRenderer = new ConfigRendered(sandbox);
export const api = new Extension(configRenderer);
