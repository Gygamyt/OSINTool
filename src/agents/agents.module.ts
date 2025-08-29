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
import { GoogleSearchModule } from "../google-search/google-search.module";
import {ValidationAgent} from "./impl/validation.agent";

@Module({
    imports: [AiModule, GoogleSearchModule],
    providers: [
        CompanyIdentificationAgent,
        RequestParsingAgent,
        OsintResearcherAgent,
        AttractivenessProfilerAgent,
        InterviewTutorAgent,
        ReportFinalizerAgent,
        ValidationAgent
    ],
    exports: [
        CompanyIdentificationAgent,
        RequestParsingAgent,
        OsintResearcherAgent,
        AttractivenessProfilerAgent,
        InterviewTutorAgent,
        ReportFinalizerAgent,
        ValidationAgent
    ],
})
export class AgentsModule {}
