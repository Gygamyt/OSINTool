import { Module } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { AgentsModule } from "../agents/agents.module";

@Module({
    imports: [AgentsModule],
    controllers: [PipelinesController],
    providers: [PipelinesService],
})
export class PipelinesModule {}