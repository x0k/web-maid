import { forwardRef, useCallback, useRef } from "react";
import FormRef, { IChangeEvent } from "@rjsf/core";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uiSchema?: UiSchema<T, RJSFSchema, any>;
  formData?: T;
  omitExtraData?: boolean;
  children?: React.ReactNode;
  asyncValidator: AsyncFactory<FormDataValidatorData<T>, ValidationData<T>>;
  onSubmit?: (data: IChangeEvent) => void;
}

const defaultSchema = {};

export type { FormRef };

export const Form = forwardRef<FormRef<unknown>, FormProps<unknown>>(
  (
    {
      id,
      schema = defaultSchema,
      uiSchema,
      children,
      formData,
      omitExtraData,
      asyncValidator,
      onSubmit,
    },
    ref
  ) => {
    const idRef = useRef(Date.now().toString(16));
    async function runValidation(
      _: string,
      { arg }: { arg: IChangeEvent<unknown> }
    ): Promise<{
      arg: IChangeEvent<unknown>;
      errorSchema: ErrorSchema<unknown>;
    }> {
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
      (event: IChangeEvent<unknown>) => {
        submit.trigger(event);
      },
      [submit.trigger]
    );
    return (
      <MuiForm
        id={id}
        ref={ref}
        schema={schema}
        uiSchema={uiSchema}
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
);
