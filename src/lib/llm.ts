import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

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
    model = "claude-sonnet-4-20250514",
    maxTokens = 8192,
  } = params;

  const jsonSchema = zodToJsonSchema(schema);

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: schemaName,
        description: `Output structured data matching the ${schemaName} schema`,
        input_schema: jsonSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: schemaName },
  });

  const toolUseBlock = response.content.find(
    (block) => block.type === "tool_use"
  );
  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("No tool use in response");
  }

  const parsed = schema.parse(toolUseBlock.input);
  return parsed;
}

function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return zodTypeToJson(schema);
}

function zodTypeToJson(schema: z.ZodType): Record<string, unknown> {
  const def = (schema as z.ZodType & { _def: Record<string, unknown> })._def;
  const typeName = def.typeName as string;
  const description = schema.description;

  const base: Record<string, unknown> = {};
  if (description) base.description = description;

  switch (typeName) {
    case "ZodObject": {
      const shape = (schema as z.ZodObject<z.ZodRawShape>).shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodType;
        const fieldDef = (fieldSchema as z.ZodType & { _def: Record<string, unknown> })._def;
        if (fieldDef.typeName === "ZodOptional") {
          properties[key] = zodTypeToJson(fieldDef.innerType as z.ZodType);
        } else {
          properties[key] = zodTypeToJson(fieldSchema);
          required.push(key);
        }
      }
      return { ...base, type: "object", properties, required };
    }
    case "ZodArray": {
      const itemSchema = def.type as unknown as z.ZodType;
      const result: Record<string, unknown> = { ...base, type: "array", items: zodTypeToJson(itemSchema) };
      if (def.minLength !== undefined && (def.minLength as { value: number }).value !== undefined) {
        result.minItems = (def.minLength as { value: number }).value;
      }
      if (def.maxLength !== undefined && (def.maxLength as { value: number }).value !== undefined) {
        result.maxItems = (def.maxLength as { value: number }).value;
      }
      return result;
    }
    case "ZodString":
      return { ...base, type: "string" };
    case "ZodNumber": {
      const result: Record<string, unknown> = { ...base, type: "number" };
      const checks = def.checks as Array<{ kind: string; value: number }> | undefined;
      if (checks) {
        for (const check of checks) {
          if (check.kind === "min") result.minimum = check.value;
          if (check.kind === "max") result.maximum = check.value;
        }
      }
      return result;
    }
    case "ZodBoolean":
      return { ...base, type: "boolean" };
    case "ZodEnum": {
      const values = def.values as string[];
      return { ...base, type: "string", enum: values };
    }
    case "ZodLiteral":
      return { ...base, const: def.value };
    case "ZodOptional":
      return zodTypeToJson(def.innerType as z.ZodType);
    case "ZodDefault":
      return zodTypeToJson(def.innerType as z.ZodType);
    default:
      return { ...base, type: "string" };
  }
}
