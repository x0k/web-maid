import { ValidationData } from "@rjsf/utils";
import { nanoid } from "nanoid";

import { IRemoteActor } from "@/lib/actor";
import { AsyncFactory } from "@/lib/factory";
import { FormDataValidatorData } from "@/components/form";

import { Action, ActionResults, ActionType } from "@/shared/rpc";

export class FormDataValidator<T>
  implements AsyncFactory<FormDataValidatorData<T>, ValidationData<T>>
{
  constructor(
    private readonly actor: IRemoteActor<Action<T>, ActionResults<T>>
  ) {}

  Create(config: FormDataValidatorData<T>): Promise<ValidationData<T>> {
    return this.actor.call({
      id: nanoid(),
      type: ActionType.ValidateFormData,
      formData: config.formData,
      schema: config.schema,
      uiSchema: config.uiSchema,
    });
  }
}
