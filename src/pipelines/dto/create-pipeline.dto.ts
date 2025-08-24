import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// 1. Определяем схему валидации с помощью Zod
const CreatePipelineSchema = z.object({
  companyName: z
    .string({
      required_error: "companyName is required",
      invalid_type_error: "companyName must be a string",
    })
    .min(1, { message: "Company name cannot be empty" }),

  // Сюда в будущем можно добавлять другие параметры
  // например, depth: z.number().optional()
});

// 2. Создаем DTO класс на основе схемы
export class CreatePipelineDto extends createZodDto(CreatePipelineSchema) {}
