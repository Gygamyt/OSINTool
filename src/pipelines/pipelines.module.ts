import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { AgentsModule } from '../agents/agents.module';
import { PipelinesProcessor } from './pipelines.processor';
import { MongooseModule } from "@nestjs/mongoose";
import { PipelineRun, PipelineRunSchema } from "./schemas/pipeline-run.schema";

@Module({
    imports: [
        AgentsModule,
        BullModule.registerQueue({
            name: 'pipelines',
        }),
        MongooseModule.forFeature([
            { name: PipelineRun.name, schema: PipelineRunSchema },
        ]),
    ],
    controllers: [PipelinesController],
    providers: [
        PipelinesService,
        PipelinesProcessor,
    ],
})
export class PipelinesModule {}
