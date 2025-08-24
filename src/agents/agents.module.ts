import { Module } from "@nestjs/common";
import {
  AttractivenessProfilerAgent,
  CompanyIdentificationAgent,
  InterviewTutorAgent,
  OsintResearcherAgent,
  ReportFinalizerAgent,
  RequestParsingAgent,
} from "./impl";
import { AiModule } from "../ai";

@Module({
  imports: [AiModule],
  providers: [
    CompanyIdentificationAgent,
    RequestParsingAgent,
    OsintResearcherAgent,
    AttractivenessProfilerAgent,
    InterviewTutorAgent,
    ReportFinalizerAgent,
  ],
  exports: [
    CompanyIdentificationAgent,
    RequestParsingAgent,
    OsintResearcherAgent,
    AttractivenessProfilerAgent,
    InterviewTutorAgent,
    ReportFinalizerAgent,
  ],
})
export class AgentsModule {}
