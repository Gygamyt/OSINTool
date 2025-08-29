import * as path from "path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

const envPath = path.resolve(__dirname, "../../.env");

loadDotenv({ path: envPath, override: true });

/**
 * Validation schema for application environment variables.
 */
const schema = z.object({
    // Node.js Environment
    LOG_LEVEL: z
        .enum(["trace", "debug", "info", "warn", "error", "fatal"])
        .default("info"),
    NODE_ENV: z.enum(["development", "production"]).default("production"),

    // Google AI & Search Keys
    GOOGLE_API_KEY: z.string().min(1, { message: "GOOGLE_API_KEY cannot be empty" }),
    GOOGLE_SEARCH_KEY: z.string().min(1, { message: "GOOGLE_SEARCH_KEY cannot be empty" }),
    GOOGLE_SEARCH_ENGINE_ID: z.string().min(1, { message: "GOOGLE_SEARCH_ENGINE_ID cannot be empty" }),

    // Database Credentials
    MONGO_USER: z.string().min(1, { message: "MONGO_USER cannot be empty" }),
    MONGO_PASSWORD: z.string().min(1, { message: "MONGO_PASSWORD cannot be empty" }),
    MONGO_DATABASE: z.string().min(1, { message: "MONGO_DATABASE cannot be empty" }),

    // Application & Prompts Logic
    COMPANY_TO_IGNORE: z.string(),
    AI_MODEL_NAME: z.string().default("models/gemini-1.5-flash-latest"),
    JOB_RETRIES: z.coerce.number().int().positive().default(1),
    TOTAL_GENERATION_RETRIES: z.coerce.number().int().positive().default(2),
    TOTAL_SEARCH_RESULTS: z.coerce.number().int().positive().default(5),
});

/**
 * Parsed and validated environment variables.
 */
export const env = schema.parse(process.env);