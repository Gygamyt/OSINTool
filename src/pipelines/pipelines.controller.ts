import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { PipelinesService } from "./pipelines.service";
import { CreatePipelineDto } from "./dto/create-pipeline.dto";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  AsyncPipelineResponseDto,
  JobStatusResponseDto, PipelineResultResponseDto,
  SyncPipelineResponseDto,
} from "./dto/pipeline-response.dto";

@ApiTags("Pipelines")
@Controller("pipelines")
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @ApiOperation({ summary: "Start a new OSINT pipeline asynchronously" })
  @ApiResponse({
    status: 201,
    description: "Pipeline started successfully.",
    type: AsyncPipelineResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input." })
  async create(@Body() createPipelineDto: CreatePipelineDto) {
    return this.pipelinesService.startPipelineAsync(createPipelineDto);
  }

  @Post("sync")
  @ApiOperation({ summary: "Start a pipeline job and wait for the result" })
  @ApiResponse({
    status: 201,
    description: "Job finished, returns the final report.",
    type: SyncPipelineResponseDto,
  })
  async createSync(@Body() createPipelineDto: CreatePipelineDto) {
    return this.pipelinesService.startPipelineSync(createPipelineDto);
  }

  @Get(":jobId")
  @ApiOperation({ summary: "Get the status and result of a pipeline job" })
  @ApiResponse({
    status: 200,
    description: "Job status retrieved.",
    type: JobStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: "Job not found." })
  async getStatus(@Param("jobId") jobId: string) {
    return this.pipelinesService.getJobStatus(jobId);
  }

  @Get("result/:jobId")
  @ApiOperation({ summary: "Get the PERSISTED RESULT of a job from MongoDB" })
  @ApiResponse({
    status: 200,
    description: "Pipeline result retrieved from database.",
    type: PipelineResultResponseDto,
  })
  @ApiResponse({ status: 404, description: "Pipeline result not found." })
  async getResult(@Param("jobId") jobId: string) {
    return this.pipelinesService.getPipelineResult(jobId);
  }
}
