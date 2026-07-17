"use client";

import type { SurveyField } from "@/entities/survey-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UseFormReturn } from "react-hook-form";

interface SurveyFieldInputProps {
  field: SurveyField;
  form: UseFormReturn<Record<string, string>>;
}

/**
 * Разобрать options — в API приходит строка с вариантами, разделёнными запятыми.
 * Например: "Frontend, Backend, DevOps, Аналитика"
 */
function parseOptions(options: string | null): string[] {
  if (!options) return [];
  return options.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Рендерит одно поле анкеты в зависимости от его типа.
 * text — Input или Textarea (по label-подсказке, если поле про "себя" — Textarea).
 * select — Select или RadioGroup (< 4 вариантов — RadioGroup, иначе Select).
 */
export function SurveyFieldInput({ field, form }: SurveyFieldInputProps) {
  const isLongText =
    field.type === "text" &&
    (field.label.toLowerCase().includes("расскажите") ||
      field.label.toLowerCase().includes("себе") ||
      field.label.toLowerCase().includes("стек"));

  const options = parseOptions(field.options);
  const useRadio = field.type === "select" && options.length <= 4;

  return (
    <FormField
      control={form.control}
      name={field.id}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>{field.label}</FormLabel>
          <FormControl>
            {field.type === "select" && options.length > 0 ? (
              useRadio ? (
                <RadioGroup
                  value={formField.value}
                  onValueChange={formField.onChange}
                  className="flex flex-col gap-2"
                >
                  {options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                      <label htmlFor={`${field.id}-${option}`} className="text-sm">
                        {option}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Select
                  value={formField.value}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите..." />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            ) : isLongText ? (
              <Textarea
                placeholder="Введите текст..."
                className="min-h-[120px] resize-y"
                value={formField.value}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
              />
            ) : (
              <Input
                placeholder="Введите текст..."
                value={formField.value}
                onChange={formField.onChange}
                onBlur={formField.onBlur}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}