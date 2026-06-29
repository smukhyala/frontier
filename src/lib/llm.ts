import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI();

export async function callStructured<T extends z.ZodType>(params: {
  system: string;
  prompt: string;
  schema: T;
  schemaName: string;
  model?: string;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  const {
    system,
    prompt,
    schema,
    schemaName,
    model = process.env.OPENAI_MODEL || "gpt-4o",
    maxTokens = 8192,
  } = params;

  // Use Zod v4's built-in JSON Schema conversion
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema["$schema"];

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: false,
        schema: jsonSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in response");
  }

  const parsed = schema.parse(JSON.parse(content));
  return parsed;
}
