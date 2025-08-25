import * as path from "path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const envPath = path.resolve(__dirname, "../../.env");

loadDotenv({ path: envPath, override: true });

/**
 * Validation schema for application environment variables.
 */
const schema = z.object({
    /**
     * The minimum level to log.
     * One of: trace, debug, info, warn, error, fatal
     */
    LOG_LEVEL: z
        .enum(["trace", "debug", "info", "warn", "error", "fatal"])
        .default("info"),

    /**
     * The runtime environment.
     * One of: development, production
     * When "development", pretty-printing is enabled.
     */
    NODE_ENV: z.enum(["development", "production"]).default("production"),

    /**
     * The API key for Google AI services.
     * Must be a non-empty string.
     */
    GOOGLE_API_KEY: z.string().min(1, { message: "GOOGLE_API_KEY cannot be empty" }),

    /**
     * The name of the company to be explicitly ignored by AI agents.
     */
    COMPANY_TO_IGNORE: z.string(),

    /**
     * The name of the Google AI model to be used by the AI service.
     */
    AI_MODEL_NAME: z.string().default("models/gemini-1.5-flash-latest"),

    /**
     * The number of times a job should be retried if it fails.
     */
    JOB_RETRIES: z.coerce.number().int().positive().default(1),
});

/**
 * Parsed and validated environment variables.
 */
export const env = schema.parse(process.env);