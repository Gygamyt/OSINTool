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
});

/**
 * Parsed and validated environment variables.
 */
export const env = schema.parse(process.env);
