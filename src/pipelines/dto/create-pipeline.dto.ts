import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreatePipelineSchema = z.object({
    companyName: z
        .string({
            required_error: 'companyName is required',
            invalid_type_error: 'companyName must be a string',
        })
        .min(1, { message: 'Company name cannot be empty' }),

    businessDomain: z
        .string({
            required_error: 'businessDomain is required',
        })
        .min(1, { message: 'Business domain cannot be empty' }),
});

export class CreatePipelineDto extends createZodDto(CreatePipelineSchema) {}
