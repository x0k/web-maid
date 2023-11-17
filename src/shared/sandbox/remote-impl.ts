import { FormDataValidatorData } from '@/components/form';
import { ActorId, IRemoteActor } from '@/lib/actor';
import { AsyncFactory } from '@/lib/factory';
import { ValidationData } from '@rjsf/utils';
import { nanoid } from 'nanoid';

import { TemplateRendererData } from '@/lib/operators/template';
import { AsyncValidatorData } from '@/lib/operators/json-schema';

import { SandboxAction, SandboxActionResults, SandboxActionType } from './action';

export class RemoteEvaluator implements AsyncFactory<string, unknown> {
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(expression: string) {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.RunEval,
      expression,
    });
  }
}

export class RemoteRenderer
  implements AsyncFactory<TemplateRendererData, string>
{
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(config: TemplateRendererData): Promise<string> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.RenderTemplate,
      template: config.template,
      data: config.data,
    });
  }
}

export class RemoteValidator
  implements AsyncFactory<AsyncValidatorData, boolean>
{
  constructor(
    private readonly handlerId: ActorId,
    private readonly actor: IRemoteActor<SandboxAction, SandboxActionResults>
  ) {}
  Create(config: AsyncValidatorData): Promise<boolean> {
    return this.actor.call({
      handlerId: this.handlerId,
      id: nanoid(),
      type: SandboxActionType.Validate,
      schema: config.schema,
      data: config.data,
    });
  }
}

export class RemoteFormDataValidator<T>
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