# OSINT Agent Pipeline Backend

This project is a NestJS backend service for performing multi-step OSINT analysis on companies using an AI agent pipeline. The application is fully containerized with Docker and Docker Compose for easy setup and development.

## ✨ Key Features

* **Multi-Step Pipeline**: A chain of 6 sequential AI agents for comprehensive analysis.
* **Asynchronous Processing**: Reliable handling of long-running tasks using a job queue system powered by Redis and BullMQ.
* **Result Persistence**: All pipeline runs and their results are saved to a MongoDB database.
* **Fully Containerized**: A single command to launch the entire stack (NestJS, Redis, MongoDB) using Docker Compose.
* **Hot-Reload for Development**: Instantly applies code changes without needing to restart containers.
* **API Documentation**: Auto-generated API documentation via Swagger (OpenAPI).
* **Configuration**: Manages all settings and secrets through `.env` files.

## 🛠️ Tech Stack

* **Framework**: NestJS, TypeScript
* **Database**: MongoDB with Mongoose
* **Job Queuing**: Redis with BullMQ
* **Containerization**: Docker, Docker Compose
* **Validation**: Zod
* **AI**: Vercel AI SDK (@ai-sdk/google)

## 🚀 Getting Started

### Prerequisites

* [Docker](https://www.docker.com/products/docker-desktop/)
* [Docker Compose](https://docs.docker.com/compose/)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Create your environment file:**
    Copy the example file to create your own local configuration.
    ```bash
    cp .env.example .env
    ```

3.  **Configure your environment:**
    Open the newly created `.env` file and provide your value for `GOOGLE_API_KEY`. The other variables can be left as their default values for development.

4.  **Launch the project:**
    Run the following command from the project's root directory:
    ```bash
    docker-compose up --build
    ```
    This command will build your application's image and start all three containers (`app`, `redis`, `mongo`).

## ⚙️ API Usage

Once the application is successfully running, the API documentation is available in your browser at:
**[http://localhost:3000/api](http://localhost:3000/api)**

### Main Endpoints

#### 1. Synchronous Pipeline Execution
Sends a request, waits for the entire pipeline to complete, and returns the final report in the response.

* `POST /pipelines/sync`

**Example Request (`curl`):**
```bash
curl -X POST http://localhost:3000/pipelines/sync \
-H "Content-Type: application/json" \
-d '{
  "companyName": "NVIDIA",
  "businessDomain": "GPU and AI Hardware Manufacturing"
}'
```

#### 2. Asynchronous Pipeline Execution
Instantly creates a job, returns its `jobId`, and processes the pipeline in the background.

* `POST /pipelines/async` - Starts a job.
* `GET /pipelines/{jobId}` - Checks the live status of the job in the Redis queue.
* `GET /pipelines/result/{jobId}` - Retrieves the final, persisted result from MongoDB.

**Example Flow (`curl`):**
```bash
# Step 1: Start the job and get a jobId
curl -X POST http://localhost:3000/pipelines/async \
-H "Content-Type: application/json" \
-d '{
  "companyName": "NVIDIA",
  "businessDomain": "GPU and AI Hardware Manufacturing"
}'

# Step 2: After some time, get the final result from the database using the jobId
curl -X GET http://localhost:3000/pipelines/result/your-job-id-here
```
---

### Template for `.env.example`

Create a `.env.example` file in the project root so other developers know which environment variables are needed.

```dotenv
# Node.js Environment
NODE_ENV=development
LOG_LEVEL=debug

# Google AI API Key
GOOGLE_API_KEY="your_google_api_key_here"

# MongoDB Credentials
MONGO_USER=admin
MONGO_PASSWORD=password123
MONGO_DATABASE=osint_db

# Prompts
COMPANY_TO_IGNORE="Some Company"
```