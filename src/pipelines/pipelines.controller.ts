import { Body, Controller, Get, Param, Post, Res, UseInterceptors } from "@nestjs/common";
import { PipelinesService } from "./pipelines.service";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  AsyncResponseDto,
  PipelineResultDto,
  SyncResponseDto,
} from "./dto/pipeline-response.dto";
import { CustomCacheInterceptor } from "../common/interceptors/cached-response.interceptor";

@ApiTags("Pipelines")
@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @ApiOperation({ summary: "Start a new OSINT pipeline asynchronously" })
  @ApiResponse({
    status: 201,
    description: "Pipeline started successfully.",
    type: AsyncResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Job result already exists and is returned.",
    type: PipelineResultDto,
  })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input." })
  @UseInterceptors(CustomCacheInterceptor)
  async create(@Body() createPipelineDto: CreatePipelineDto) {
    return this.pipelinesService.startPipelineAsync(createPipelineDto);
  }

  @Post("sync")
  @ApiOperation({ summary: "Start a pipeline job and wait for the result" })
  @ApiResponse({
    status: 201,
    description: "Job finished, returns the final report.",
    type: SyncResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Job result already exists and is returned.",
    type: PipelineResultDto,
  })
  @UseInterceptors(CustomCacheInterceptor)
  async createSync(@Body() createPipelineDto: CreatePipelineDto) {
    return this.pipelinesService.startPipelineSync(createPipelineDto);
  }

  @Get("status/:requestId")
  @ApiOperation({ summary: "Get job status by REQUEST ID" })
  @ApiResponse({
    status: 200,
    description: "Job status retrieved.",
    type: PipelineResultDto,
  })
  @ApiResponse({ status: 404, description: "Job not found." })
  async getStatusByRequestId(@Param("requestId") requestId: string) {
    return this.pipelinesService.getJobStatusByRequestId(requestId);
  }

  @Get("result/:requestId")
  @ApiOperation({ summary: "Get persisted result by REQUEST ID" })
  @ApiResponse({
    status: 200,
    description: "Pipeline result retrieved from database.",
    type: PipelineResultDto,
  })
  @ApiResponse({ status: 404, description: "Pipeline result not found." })
  async getResultByRequestId(@Param("requestId") requestId: string) {
    return this.pipelinesService.getPipelineResultByRequestId(requestId);
  }

  @Get("status/job/:jobId")
  @ApiOperation({ summary: "[Legacy] Get job status by JOB ID" })
  @ApiResponse({
    status: 200,
    description: "Job status retrieved.",
    type: PipelineResultDto,
  })
  @ApiResponse({ status: 404, description: "Job not found." })
  async getStatusByJobId(@Param("jobId") jobId: string) {
    return this.pipelinesService.getJobStatus(jobId);
  }

  @Get("result/job/:jobId")
  @ApiOperation({ summary: "[Legacy] Get persisted result by JOB ID" })
  @ApiResponse({
    status: 200,
    description: "Pipeline result retrieved from database.",
    type: PipelineResultDto,
  })
  @ApiResponse({ status: 404, description: "Pipeline result not found." })
  async getResultByJobId(@Param("jobId") jobId: string) {
    return this.pipelinesService.getPipelineResult(jobId);
  }
}
