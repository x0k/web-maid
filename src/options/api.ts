import { RemoteActor } from "@/lib/actor";

import { Extension } from "@/shared/extension";
import { Action, ActionResults, ConfigRendered } from "@/shared/rpc";

const sandboxIFrame = document.getElementById("sandbox") as HTMLIFrameElement;
const sandbox = new RemoteActor<Action, ActionResults, string>(sandboxIFrame);
sandbox.listen(window);

export const api = new Extension(new ConfigRendered(sandbox));
