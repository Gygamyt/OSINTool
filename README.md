# OSINT Agent Pipeline Backend

This project is a NestJS backend service for performing multi-step OSINT analysis on companies using an AI agent pipeline. The application is fully containerized with Docker and Docker Compose for easy setup and development.

## ✨ Key Features

* **Multi-Step Pipeline**: A chain of sequential AI agents for comprehensive analysis.
* **Asynchronous Processing**: Reliable handling of long-running tasks using a job queue system powered by Redis and BullMQ.
* **Result Persistence**: All pipeline runs and their results are saved to a MongoDB database, with progressive updates.
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

### Installation & Setup

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
    Open the newly created `.env` file and provide your value for `GOOGLE_API_KEY` and other keys for google integration. The other variables can be left as their default values for development.

4.  **Launch the project:**
    Run the following command from the project's root directory:
    ```bash
    docker-compose up --build
    ```
    This command will build your application's image and start all three containers (`app`, `redis`, `mongo`).

## ⚙️ API Usage

Once the application is successfully running, the API documentation is available in your browser at:
**[http://localhost:8080/api](http://localhost:8080/api)**

### Primary Workflow

The API operates on a simple, asynchronous, two-step process.

#### Step 1: Start a Pipeline
You initiate a new OSINT pipeline by sending a `POST` request. The server will immediately accept the job and return its unique identifiers.

* `POST /pipelines`

**Example Request (`curl`):**
```bash
curl -X POST http://localhost:3000/pipelines \
-H "Content-Type: application/json" \
-d '{
  "requestId": "some-unique-client-id-123",
  "request": "Bla-bla-bla",
  "businessDomain": "GPU and AI Hardware Manufacturing"
}'
