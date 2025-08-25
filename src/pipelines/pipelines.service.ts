import { Injectable, Logger, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, QueueEvents } from "bullmq";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import * as crypto from "crypto";

@Injectable()
export class PipelinesService implements OnModuleDestroy {
  private readonly logger = new Logger(PipelinesService.name);
  private readonly queueEvents: QueueEvents;

  constructor(
    @InjectQueue("pipelines") private readonly pipelinesQueue: Queue,
  ) {
    this.queueEvents = new QueueEvents("pipelines", {
      connection: {
        host: "redis",
        port: 6379,
      },
    });
  }

  async onModuleDestroy() {
    await this.queueEvents.close();
  }

  async startPipelineAsync(createPipelineDto: CreatePipelineDto) {
    this.logger.log(
      `Adding pipeline job for: "${createPipelineDto.companyName}"`,
    );

    const customJobId = crypto.randomUUID();

    const job = await this.pipelinesQueue.add(
      "run-pipeline",
      createPipelineDto,
      {
        jobId: customJobId,
        attempts: 1,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    this.logger.log(`Job with ID ${job.id} added to the queue.`);

    return {
      message: "Pipeline accepted and will be processed.",
      jobId: job.id,
    };
  }

  async startPipelineSync(createPipelineDto: CreatePipelineDto) {
    const customJobId = crypto.randomUUID();
    this.logger.log(`Adding and awaiting SYNC job ${customJobId}`);

    const job = await this.pipelinesQueue.add(
      "run-pipeline",
      createPipelineDto,
      {
        jobId: customJobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    );

    try {
      const result = await job.waitUntilFinished(this.queueEvents);
      this.logger.log(`Job ${customJobId} finished with result.`);
      return {
        data: {
          fullResponse: result,
          jobId: customJobId,
        },
      };
    } catch (error) {
      this.logger.error(`Job ${customJobId} failed.`, error);
      throw new Error(`Pipeline job ${customJobId} failed: ${error.message}`);
    }
  }

  async getJobStatus(jobId: string) {
    this.logger.log(`Fetching status for job ID: ${jobId}`);

    // Находим задачу по ID
    const job = await this.pipelinesQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }

    // Проверяем текущий статус задачи
    const state = await job.getState();
    const result = job.returnvalue; // Результат выполнения (если есть)
    const failedReason = job.failedReason; // Причина ошибки (если есть)

    this.logger.log(`Job ${jobId} is in state: ${state}`);

    return {
      jobId: job.id,
      state, // 'completed', 'waiting', 'active', 'failed', etc.
      progress: job.progress, // (мы пока не используем, но можно)
      result,
      failedReason,
    };
  }
}
