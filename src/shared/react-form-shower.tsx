import { useMemo } from 'react';
import { Root } from "react-dom/client";
import { Box, Button } from "@mui/material";
import { IChangeEvent } from "@rjsf/core";
import { ValidationData } from "@rjsf/utils";

import { AsyncFactory, Factory } from "@/lib/factory";
import { ShowFormData } from "@/lib/operators/json-schema";
import { Form, FormDataValidatorData } from "@/components/form";

export class ReactFormShower implements AsyncFactory<ShowFormData, unknown> {
  constructor(
    private readonly rootFactory: Factory<void, Root>,
    private readonly asyncValidator: AsyncFactory<
      FormDataValidatorData<unknown>,
      ValidationData<unknown>
    >
  ) {}
  async Create({
    schema,
    data,
    omitExtraData,
    uiSchema,
  }: ShowFormData): Promise<unknown> {
    const root = this.rootFactory.Create();
    try {
      return await new Promise((resolve, reject) => {
        function handleSubmit({ formData }: IChangeEvent<unknown>) {
          resolve(formData);
        }
        function handleCancel() {
          reject(new Error("Form cancelled"));
        }
        root.render(
          <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={data}
            omitExtraData={omitExtraData}
            onSubmit={handleSubmit}
            asyncValidator={this.asyncValidator}
          >
            <Box
              display="flex"
              flexDirection="row"
              gap={2}
              alignItems="center"
              pt={2}
            >
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="small"
              >
                Submit
              </Button>
            </Box>
          </Form>
        );
      });
    } finally {
      root.unmount();
    }
  }
}

export function useFormShower(
  rootFactory: Factory<void, Root>,
  asyncValidator: AsyncFactory<
    FormDataValidatorData<unknown>,
    ValidationData<unknown>
  >
): AsyncFactory<ShowFormData, unknown> {
  return useMemo(
    () => new ReactFormShower(rootFactory, asyncValidator),
    [rootFactory, asyncValidator]
  );
}

