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

  let response;
  try {
    response = await client.chat.completions.create({
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
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown OpenAI API error";
    if (message.includes("401") || message.includes("Incorrect API key")) {
      throw new Error(
        "Invalid OpenAI API key. Check OPENAI_API_KEY in your .env.local file."
      );
    }
    if (message.includes("429")) {
      throw new Error(
        "OpenAI rate limit exceeded. Wait a moment and try again."
      );
    }
    throw new Error(`OpenAI API call failed: ${message}`);
  }

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No content in response");

  try {
    return schema.parse(JSON.parse(content));
  } catch {
    throw new Error(
      "LLM returned an invalid response that didn't match the expected schema. Try running the analysis again."
    );
  }
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
