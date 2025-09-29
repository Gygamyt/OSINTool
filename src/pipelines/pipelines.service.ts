import { Injectable, NotFoundException, OnModuleDestroy } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, QueueEvents } from "bullmq";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import * as crypto from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import {
  PipelineRun,
  PipelineRunDocument,
} from "./schemas/pipeline-run.schema";
import { Model } from "mongoose";
import { env } from "../config/env";

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
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD
      },
    });
  }

  async onModuleDestroy() {
    await this.queueEvents.close();
  }

  async startPipelineAsync(createPipelineDto: CreatePipelineDto) {
    const existingRun = await this.pipelineRunModel
      .findOne({ requestId: createPipelineDto.requestId })
      .exec();

    if (existingRun) {
      if (!existingRun.cached) {
        existingRun.cached = true;
        await existingRun.save();
      }
      return existingRun;
    }

    const customJobId = crypto.randomUUID();

    const job = await this.pipelinesQueue.add(
      "run-pipeline",
      createPipelineDto,
      {
        jobId: customJobId,
        attempts: env.JOB_RETRIES,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    return {
      message: "Pipeline job accepted. Check status using the jobId.",
      jobId: job.id,
      requestId: createPipelineDto.requestId,
    };
  }

  async startPipelineSync(createPipelineDto: CreatePipelineDto) {
    const existingRun = await this.pipelineRunModel
      .findOne({ requestId: createPipelineDto.requestId })
      .exec();

    if (existingRun) {
      if (!existingRun.cached) {
        existingRun.cached = true;
        await existingRun.save();
      }
      return existingRun;
    }

    const customJobId = crypto.randomUUID();

    const job = await this.pipelinesQueue.add(
      "run-pipeline",
      createPipelineDto,
      {
        jobId: customJobId,
        attempts: env.JOB_RETRIES,
        backoff: { type: "exponential", delay: 1000 },
      },
    );

    try {
      const result = await job.waitUntilFinished(this.queueEvents);
      return {
        data: {
          fullResponse: result.finalReport,
          jobId: customJobId,
          requestId: result.requestId,
        },
      };
    } catch (error) {
      throw new Error(`Pipeline job ${customJobId} failed: ${error.message}`);
    }
  }

  async getJobStatus(jobId: string) {
    return this.getPipelineResult(jobId);
  }

  async getPipelineResult(jobId: string) {
    const updatedRun = await this.pipelineRunModel
      .findOneAndUpdate(
        { jobId: jobId, cached: false },
        { $set: { cached: true } },
        { new: true },
      )
      .exec();
    if (updatedRun) {
      return updatedRun;
    }
    const existingRun = await this.pipelineRunModel
      .findOne({ jobId: jobId })
      .exec();

    if (!existingRun) {
      throw new NotFoundException(
        `Pipeline run with job ID ${jobId} not found.`,
      );
    }

    return existingRun;
  }

  async getPipelineResultByRequestId(requestId: string) {
    const updatedRun = await this.pipelineRunModel
      .findOneAndUpdate(
        { requestId: requestId, cached: false },
        { $set: { cached: true } },
        { new: true },
      )
      .exec();

    if (updatedRun) {
      return updatedRun;
    }

    const existingRun = await this.pipelineRunModel
      .findOne({ requestId: requestId })
      .exec();

    if (!existingRun) {
      throw new NotFoundException(
        `Pipeline run with request ID ${requestId} not found.`,
      );
    }

    return existingRun;
  }

  async getJobStatusByRequestId(requestId: string) {
    return this.getPipelineResultByRequestId(requestId);
  }
}
