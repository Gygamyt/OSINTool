import { Module } from '@nestjs/common';
import { AiModelService } from './ai-model.service';

@Module({
    providers: [AiModelService],
    exports: [AiModelService], // Экспортируем сервис, чтобы его можно было использовать в других модулях
})
export class AiModule {}