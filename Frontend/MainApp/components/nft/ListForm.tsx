"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";

import * as RadioGroup from "@radix-ui/react-radio-group";
const options = [
  {
    value: "fixed_price",
    label: "Fixed price",
  },
  {
    value: "auction",
    label: "Auction",
  },
  //   {
  //     value: "type",
  //     label: "Type",
  //   },
];

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  type: z.string().min(2, {
    message: "Sale type should be selected.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  price: z.number().gt(0, {
    message: "Price must be greater than zero",
  }),
});

export function ListForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Secured media"
                  {...field}
                  className="border border-primary"
                />
              </FormControl>
              {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your creation"
                  {...field}
                  className="border border-primary resize-none h-40"
                />
              </FormControl>
              {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sale Type</FormLabel>
              <FormControl>
                <RadioGroup.Root
                  defaultValue={options[0].value}
                  className=" w-full grid grid-cols-2 gap-3"
                >
                  {options.map((option) => (
                    <RadioGroup.Item
                      {...field}
                      key={option.value}
                      value={option.value}
                      className="border border-primary rounded-md py-1 px-3 cursor-pointer  data-[state=checked]:text-white data-[state=checked]:bg-primary"
                    >
                      <span className="font-semibold tracking-tight">
                        {option.label}
                      </span>
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </FormControl>
              {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (ETH)</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.0"
                  type="number"
                  {...field}
                  className="border border-primary"
                />
              </FormControl>
              {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="w-full text-right">
          {" "}
          <Button type="submit">List on Marketplace</Button>
        </div>
      </form>
    </Form>
  );
}
