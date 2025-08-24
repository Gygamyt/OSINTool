import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PipelinesModule } from "../pipelines/pipelines.module";
import { AgentsModule } from "../agents/agents.module";
import { AiModule } from "../ai";

@Module({
  imports: [PipelinesModule, AgentsModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
