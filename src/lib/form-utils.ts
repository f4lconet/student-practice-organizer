import { z } from "zod";
import type { SurveyField } from "@/entities/survey-field";

/**
 * Разобрать options — в API приходит строка с вариантами, разделёнными запятыми.
 * Например: "Frontend, Backend, DevOps, Аналитика"
 */
function parseOptions(options: string | null): string[] {
  if (!options) return [];
  return options.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Динамически генерирует zod-схему валидации на основе массива полей анкеты.
 *
 * Все поля считаются обязательными (строка, minLength: 1).
 * Для select-полей валидируется, что значение входит в список options.
 *
 * ПРИМЕЧАНИЕ: финальный список полей анкеты уточняется (см. п. 13 ТЗ).
 * Схема легко расширяется — достаточно добавить новые поля в конфигурацию.
 */
export function buildSurveySchema(fields: SurveyField[]) {
  const shape: Record<string, z.ZodString> = {};

  for (const field of fields) {
    let fieldSchema = z
      .string()
      .min(1, { message: `Поле «${field.label}» обязательно` });

    if (field.type === "select" && field.options) {
      const options = parseOptions(field.options);
      if (options.length > 0) {
        fieldSchema = fieldSchema.refine(
          (val) => options.includes(val),
          { message: `Выберите один из вариантов: ${options.join(", ")}` },
        );
      }
    }

    shape[field.id] = fieldSchema;
  }

  return z.object(shape);
}

export type SurveyFormValues = z.infer<ReturnType<typeof buildSurveySchema>>;