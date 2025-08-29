import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PipelinesModule } from "../pipelines/pipelines.module";
import { AgentsModule } from "../agents/agents.module";
import { AiModule } from "../ai";
import { BullModule } from "@nestjs/bullmq";
import { MongooseModule } from "@nestjs/mongoose";
import { GoogleSearchModule } from "../google-search/google-search.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GoogleSearchModule,
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongo:27017/${process.env.MONGO_DATABASE}?authSource=admin`,
      }),
    }),
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
