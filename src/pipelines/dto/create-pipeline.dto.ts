import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreatePipelineSchema = z.object({
    requestId: z
        .string({ required_error: 'requestId is required' })
        .min(1, { message: 'requestId cannot be empty' }),

    request: z
        .string({
            required_error: 'request is required',
            invalid_type_error: 'request must be a string',
        })
        .min(1, { message: 'Request cannot be empty' }),

    businessDomain: z
        .string({
            required_error: 'businessDomain is required',
        })
        .min(1, { message: 'Business domain cannot be empty' }),
});

export class CreatePipelineDto extends createZodDto(CreatePipelineSchema) {}
