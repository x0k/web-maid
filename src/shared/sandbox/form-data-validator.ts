import { ValidationData } from "@rjsf/utils";
import { nanoid } from "nanoid";

import { ActorId, IRemoteActor } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { FormDataValidatorData } from "@/components/form";

import {
  SandboxAction,
  SandboxActionResults,
  SandboxActionType,
} from "./action";

export class FormDataValidator<T>
  implements AsyncFactory<FormDataValidatorData<T>, ValidationData<T>>
{
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<
      SandboxAction<T>,
      SandboxActionResults<T>
    >
  ) {}

  Create(config: FormDataValidatorData<T>): Promise<ValidationData<T>> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.ValidateFormData,
      formData: config.formData,
      schema: config.schema,
      uiSchema: config.uiSchema,
    });
  }
}
