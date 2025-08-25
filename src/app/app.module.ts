import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PipelinesModule } from "../pipelines/pipelines.module";
import { AgentsModule } from "../agents/agents.module";
import { AiModule } from "../ai";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: "redis",
        port: 6379,
      },
    }),
    PipelinesModule,
    AgentsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
