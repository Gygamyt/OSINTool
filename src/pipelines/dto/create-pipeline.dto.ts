import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 1. Обновляем схему валидации
const CreatePipelineSchema = z.object({
    companyName: z
        .string({
            required_error: 'companyName is required',
            invalid_type_error: 'companyName must be a string',
        })
        .min(1, { message: 'Company name cannot be empty' }),

    // --- ДОБАВЛЯЕМ НОВОЕ ПОЛЕ ---
    businessDomain: z
        .string({
            required_error: 'businessDomain is required',
        })
        .min(1, { message: 'Business domain cannot be empty' }),
});

// 2. DTO класс автоматически подхватит изменения
export class CreatePipelineDto extends createZodDto(CreatePipelineSchema) {}
