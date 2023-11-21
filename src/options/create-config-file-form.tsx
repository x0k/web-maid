import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const createFileFormSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine((value) => value !== "main", {
      message: "File name cannot be 'main'",
    }),
});

export interface CreateConfigFileFormProps {
  onSubmit: (
    data: z.infer<typeof createFileFormSchema>
  ) => unknown | Promise<unknown>;
}

export function CreateConfigFileForm({ onSubmit }: CreateConfigFileFormProps) {
  const form = useForm<z.infer<typeof createFileFormSchema>>({
    resolver: zodResolver(createFileFormSchema),
    defaultValues: {
      name: "",
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
