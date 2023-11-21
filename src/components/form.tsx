import { forwardRef, useCallback } from "react";
import FormRef, { IChangeEvent } from "@rjsf/core";
import MuiForm from "@rjsf/mui";
import { RJSFSchema, UiSchema, ValidationData } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";

import type { AsyncFactory } from "@/lib/factory";
import { stringifyError } from "@/lib/error";
import { useMutation } from "@tanstack/react-query";

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
    const submitMutation = useMutation({
      mutationFn: async ({
        formData,
        schema,
        uiSchema,
      }: IChangeEvent<unknown>) => {
        try {
          const { errorSchema } = await asyncValidator.Create({
            formData,
            schema,
            uiSchema,
          });
          return { errorSchema };
        } catch (e) {
          return {
            errorSchema: {
              __errors: [stringifyError(e)],
            },
          };
        }
      },
      onSuccess: ({ errorSchema }, event) => {
        if (Object.keys(errorSchema).length > 0) {
          return;
        }
        onSubmit?.(event);
      },
    });
    const formSubmitHandler = useCallback(
      (event: IChangeEvent<unknown>) => {
        submitMutation.mutate(event);
      },
      [submitMutation.mutate]
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
        extraErrors={submitMutation.data?.errorSchema}
        onSubmit={formSubmitHandler}
      />
    );
  }
);
