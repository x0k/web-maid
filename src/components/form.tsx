import { useCallback, useRef } from "react";
import { IChangeEvent } from "@rjsf/core";
import MuiForm from "@rjsf/mui";
import { ErrorSchema, RJSFSchema, UiSchema, ValidationData } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import useSWRMutation from "swr/mutation";

import type { AsyncFactory } from "@/lib/factory";
import { stringifyError } from "@/lib/error";

export interface FormDataValidatorData<T> {
  formData: T | undefined;
  schema: RJSFSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: UiSchema<T, RJSFSchema, any>;
}

export interface FormProps<T> {
  id?: string;
  schema?: RJSFSchema;
  formData?: T;
  omitExtraData?: boolean;
  children?: React.ReactNode;
  asyncValidator: AsyncFactory<FormDataValidatorData<T>, ValidationData<T>>;
  onSubmit?: (data: IChangeEvent) => void;
}

const defaultSchema = {};

export function Form<T>({
  id,
  schema = defaultSchema,
  children,
  formData,
  omitExtraData,
  asyncValidator,
  onSubmit,
}: FormProps<T>) {
  const idRef = useRef(Date.now().toString(16));
  async function runValidation(
    _: string,
    { arg }: { arg: IChangeEvent<T> }
  ): Promise<{ arg: IChangeEvent<T>; errorSchema: ErrorSchema<T> }> {
    const { formData, schema, uiSchema } = arg;
    try {
      const { errorSchema } = await asyncValidator.Create({
        formData,
        schema,
        uiSchema,
      });
      return { arg, errorSchema };
    } catch (e) {
      return {
        arg,
        errorSchema: {
          __errors: [stringifyError(e)],
        },
      };
    }
  }
  const submit = useSWRMutation(idRef.current, runValidation, {
    onSuccess({ arg, errorSchema }) {
      if (Object.keys(errorSchema).length > 0) {
        return;
      }
      onSubmit?.(arg);
    },
  });
  const formSubmitHandler = useCallback(
    (event: IChangeEvent<T>) => {
      submit.trigger(event);
    },
    [submit.trigger]
  );
  return (
    <MuiForm
      id={id}
      schema={schema}
      formData={formData}
      omitExtraData={omitExtraData}
      children={children}
      validator={validator}
      noValidate
      extraErrors={submit.data?.errorSchema}
      onSubmit={formSubmitHandler}
    />
  );
}
