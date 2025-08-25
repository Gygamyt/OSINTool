import { Module } from '@nestjs/common';
import { AiModelService } from './ai-model.service';

@Module({
    providers: [AiModelService],
    exports: [AiModelService],
})
export class AiModule {}