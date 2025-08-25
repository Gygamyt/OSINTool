import { Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, QueueEvents } from "bullmq";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import * as crypto from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { PipelineRun, PipelineRunDocument } from "./schemas/pipeline-run.schema";
import { Model } from "mongoose";

@Injectable()
export class PipelinesService implements OnModuleDestroy {
  private readonly queueEvents: QueueEvents;

  constructor(
    @InjectQueue("pipelines") private readonly pipelinesQueue: Queue,
    @InjectModel(PipelineRun.name)
    private pipelineRunModel: Model<PipelineRunDocument>,
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

    return {
      message: "Pipeline accepted and will be processed.",
      jobId: job.id,
    };
  }

  async startPipelineSync(createPipelineDto: CreatePipelineDto) {
    const customJobId = crypto.randomUUID();

    const job = await this.pipelinesQueue.add(
      "run-pipeline",
      createPipelineDto,
      {
        jobId: crypto.randomUUID(),
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    );

    try {
      const result = await job.waitUntilFinished(this.queueEvents);
      return {
        data: {
          fullResponse: result,
          jobId: customJobId,
        },
      };
    } catch (error) {
      throw new Error(`Pipeline job ${customJobId} failed: ${error.message}`);
    }
  }

  async getJobStatus(jobId: string) {
    const job = await this.pipelinesQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      jobId: job.id,
      state,
      progress: job.progress,
      result,
      failedReason,
    };
  }

  async getPipelineResult(jobId: string) {
    const pipelineRun = await this.pipelineRunModel
      .findOne({ jobId: jobId })
      .exec();

    if (!pipelineRun) {
      throw new NotFoundException(
        `Pipeline result with job ID ${jobId} not found.`,
      );
    }

    return {
      data: pipelineRun,
    };
  }
}
