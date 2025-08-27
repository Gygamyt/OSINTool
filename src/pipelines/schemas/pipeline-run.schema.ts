import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PipelineRunDocument = HydratedDocument<PipelineRun>;

@Schema({ timestamps: true })
export class PipelineRun {
    @Prop({ required: true, unique: true, index: true })
    requestId: string;

    @Prop({ required: true, unique: true, index: true })
    jobId: string;

    @Prop({ required: true })
    status: 'processing' | 'completed' | 'failed';

    @Prop({ required: true })
    request: string;

    @Prop({ required: true })
    businessDomain: string;

    @Prop({ type: Object })
    intermediateSteps?: Record<string, any>;

    @Prop({ type: String })
    finalReport?: string;

    @Prop({ type: String })
    errorMessage?: string;

    @Prop({ type: Boolean, default: false })
    cached?: boolean;
}

export const PipelineRunSchema = SchemaFactory.createForClass(PipelineRun);
