import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { AgentsModule } from '../agents/agents.module';
import { PipelinesProcessor } from './pipelines.processor';

@Module({
    imports: [
        AgentsModule,
        BullModule.registerQueue({
            name: 'pipelines',
        }),
    ],
    controllers: [PipelinesController],
    providers: [
        PipelinesService,
        PipelinesProcessor,
    ],
})
export class PipelinesModule {}
