import { Controller, Post, Body } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Pipelines')
@Controller('pipelines')
export class PipelinesController {
    constructor(private readonly pipelinesService: PipelinesService) {}

    @Post()
    @ApiOperation({ summary: 'Start a new OSINT pipeline' })
    @ApiResponse({ status: 201, description: 'Pipeline started successfully.' })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid input.' })
    async create(@Body() createPipelineDto: CreatePipelineDto) {
        return this.pipelinesService.startPipeline(createPipelineDto);
    }
}
