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
  temperature?: number;
}): Promise<z.infer<T>> {
  const {
    system,
    prompt,
    schema,
    schemaName,
    model = process.env.OPENAI_MODEL || "gpt-4o",
    maxTokens = 8192,
    temperature,
  } = params;

  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema["$schema"];
  stripUnsupportedKeywords(jsonSchema);

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema: jsonSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in response");

  return schema.parse(JSON.parse(content));
}

function stripUnsupportedKeywords(obj: Record<string, unknown>): void {
  delete obj["minItems"];
  delete obj["maxItems"];
  delete obj["minimum"];
  delete obj["maximum"];
  delete obj["pattern"];
  delete obj["format"];
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      stripUnsupportedKeywords(value as Record<string, unknown>);
    }
  }
}
