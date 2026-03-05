import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { env } from "../config/env";

@Injectable()
export class AiModelService implements OnModuleInit {
  private readonly logger = new Logger(AiModelService.name);
  private vertexProvider: any;
  private readonly tempKeyPath = path.join(
    os.tmpdir(),
    `gcp-key-${Date.now()}.json`,
  );

  constructor() {
    this.setupCredentials();
  }

  private setupCredentials() {
    try {
      const credentials = env.GOOGLE_SERVICE_ACCOUNT_BASE64;

      const privateKey = credentials.private_key.replace(/\\n/g, "\n");

      const keyFileContent = JSON.stringify({
        ...credentials,
        private_key: privateKey,
      });

      fs.writeFileSync(this.tempKeyPath, keyFileContent);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = this.tempKeyPath;

      this.logger.log(`Temporary GCP key created at: ${this.tempKeyPath}`);

      this.vertexProvider = createVertex({
        project: credentials.project_id,
        location: "us-central1",
      });
    } catch (error) {
      this.logger.error("Failed to setup GCP credentials file", error.stack);
    }
  }

  onModuleInit() {
    process.on("exit", () => {
      if (fs.existsSync(this.tempKeyPath)) {
        fs.unlinkSync(this.tempKeyPath);
      }
    });
  }

  async generate(prompt: string): Promise<string> {
    try {
      const modelName = env.AI_MODEL_NAME.replace("models/", "");

      const { text } = await generateText({
        model: this.vertexProvider(modelName),
        prompt: prompt,
      });

      return text;
    } catch (error) {
      this.logger.error("Vertex AI call failed!", {
        message: error.message,
        keyPathExists: fs.existsSync(this.tempKeyPath),
        envPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });
      throw new Error("Failed to generate text");
    }
  }
}

