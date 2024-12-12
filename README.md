# Connor's AI Representative

This codebase implements a full-stack professional AI representative, designed to answer professional questions about Connor Haines. Visit the deployed project at: [connor-haines.com](http://connor-haines.com{:target="_blank"}).

This repo contains the full-stack code for my AI representative:

- **Backend**: LangGraph + FastAPI
- **Data Layer**: Postgres + Alembic + Prompt Engineering
- **Frontend**: NextJS + React
- **Infrastructure as Code**: GCP Project Terraform + Helm/Kubernetes Manifest
- **CI/CD**: Github Actions

I won't discuss each of these parts in detail in this README. Instead, I'll highlight the parts I find most interesting.

## Project Motivation

> "Large Language Models get the hype, but compound systems are the future of AI" - Christopher Pots, Stanford.

At this moment, software engineering is rapidly evolving. AI is transforming what it means to work in tech, and what it is possible for software to accomplish. I believe that building complex systems that combine engineering best practices and AI decision engines is the future of software. An LLM on it's own is just an inert artifact - at the very least, it needs a prompt in order to produce output. So, from the very start we move from pure LLM's to systems, and building system is what engineers do.

AI offers a new paradigm for software, and I think it's really exciting! What does it means to have a decision engine as powerful as GPT-4o or Sonnet 3.5 as the focal point of your software? How do you write code around these non-deterministic decision engines in a way that drives value?

This project is my first attempt at diving into this field, and I hope it leads a to an opportunity to work professionally on an exciting AI project.

## Backend

### LangGraph Architecture

As the industry moves towards Agentic AI, LangGraph is the updated offering from the same team that built LangChain. Orchestrating AI calls in a graph allows for advance functionality like request routing, tool calling, and more.

My graph in `chain.py` implements a conversational AI assistant using LangGraph, designed for handling interactions with tool integrations.

#### State Manager

- Manages conversation context using `MessagesState`
- Implements persistent state handling through Postgres checkpointing

#### Graph Nodes

- Model Node (invoke_model)

  - Processes inputs through GPT-4-mini
  - Integrates system prompts and tool bindings
  - Orchestrates the conversation flow

- Tools Node (invoke_tools)

  - Executes external integration Calendly scheduling
  - Returns standardized ToolMessage responses

- Flow Controller (invoke_tools_or_return)

  - The system employs conditional branching logic to:
    - Route messages to tool execution when needed
    - Handle state transitions seamlessly

#### Persistence

- PostgreSQL integration ensures reliable state management across conversation sessions. This type of state persistence can allow for 'replaying' graph executions, and 'time-traveling' back through the graph.

#### Architecture Benefits

- Modular design for easy tool integration
- Robust state management
- Clear separation of concerns
- Scalable conversation flow handling

This architecture provides a foundation for building complex conversational AI systems with integrated tool capabilities. While the Graph is relatively simple currently, it's easily extensible as I craft more complex Agentic workflows.

### Prompt Engineering

I'm using a strategy called long-context prompting. Many LLM's have increasingly long context windows: for 4o-mini it's currently 200,000 tokens, for Gemini 1.5 is 10x that up at 2 million tokens. My system prompt is around 10% of the 4o-mini limit, or 20k tokens.

[Initial research suggests](https://arxiv.org/pdf/2403.05530) that long-context prompting is just as effective as Retrieval Augmented Generation (RAG). My take: when you are at a fraction of the context limit, latency isn't a big concern for your use case, and token cost isn't a driving factor, then long-context prompting is a great way to go. I meet those criteria, so I'm using long-context prompting.

I've developed my prompt iteratively, primarily through conversations with Claude. (For example, I'll ask Claude to identify unclear parts of my prompt, and then refine those.)

I also use several prompt-engineering techniques, such as multi-shot prompting: my prompt includes several examples of questions with both good and bad example responses. I also have a script `repo_summary.py` which takes the entire codebase and prompts an LLM to summarize the codebase in detail. This is also included in my long-context prompting.

I start my prompt with a bunch of documents that make up the long-context prompting: these include documents like my resume, writing samples, cover letters, etc.

I end the prompt with a system prompt that defines the persona of the chatbot. This includes discussion guidelines, voice + character calibration, conversation boundaries, and more.

## Generative UI Frontend

My past professional experience has been with Angular. I decided to build this frontend with React + NextJS. I enjoy JSX a lot, but I'm still learning React so the frontend could use some TLC at some point.

One cool aspect of my frontend is that the frontend implements dynamic UI generation based on LangGraph event streams, creating an adaptive interface that responds to LLM outputs.

### Event-Driven Component Architecture

After the user submits a prompt to the backend, the LangGraph execution events are streamed to the frontend, and handled like this:

1. Chain Start

   - Renders initial loading state (the [...] indicator)
   - Prepares UI for incoming LLM response

2. Tool Selection

   - Identifies tool or text from LLM output
   - Renders appropriate loading component if relevant

3. Tool Execution

   - Updates UI with tool results or text streaming
   - Handles success/error states

4. Stream Processing

   - Manages streaming LLM responses
   - Updates UI components in real-time

#### Key Features

- Dynamic Component Resolution: Components render based on LLM tool selection or text streaming
- Stateful UI Updates: Maintains coherent state during streaming
- Real-time Streaming: Progressive UI updates as data arrives

This architecture enables fluid, context-aware UI generation driven by LLM outputs.

## Infrastructure & DevOps

Spinning up a full GKE cluster for this personal project is probably a bit of overkill. After all, one of the key benefits of kubernetes is scaling, which isn't really something I need to be worried about here!

Still, this is relevant professional skill I have, so I wanted to go to the effort to include a thorough GCP + Kubernetes setup.

#### Cloud Infrastructure (GCP)

- GKE Autopilot Cluster: Managed Kubernetes environment
- Artifact Registry: Docker image repository
- Cloud Storage: System prompts storage
- Cloud DNS: Domain management for connor-haines.com
- Static IPs: Dedicated IPs for frontend/backend ingress
- Identity & Security via service accounts

#### Kubernetes Resources

- Helm Charts:
  - Deployments
  - Services
  - Ingress
  - ConfigMaps
  - Secrets
- Network Policies
- Default deny-all
- Allowed ingress configurations

#### CI/CD Pipeline

- GitHub Actions Workflow
- Authenticate with GCP
- Build & push Docker images
- Deploy via Helm
- Manage secrets via Secret Manager

#### Monitoring & Security

- GKE Autopilot monitoring
- Workload identity for secure access
- Network policies for k8s

## Future Development

I'm currently working on extending the contextual awareness of my AI representative. While my representative responds adequately to most professional background questions, I find that when asked technical questions the results are rather bland. You may as well just be chatting with ChatGPT.

My plan is to implement Retrieval Augmented Generation (RAG) on a vector database containing documents that match the informational eco-system that the real-life Connor consumes. Think: podcasts and youtube video transcripts, blog articles, and other curated technical sources of information.

But rather than store the entire documents (which would be quite 'noisy' semantically relative to the intention of my chatbot) I will store 'memories' derived from these sources in a vector database.

I have some ideas for how to make this clever, the main thrust of which is: I want detailed memories that wherever possible relate the memories to (1) Connor's biographical information, and (2) other 'memories' already stored in the Vector DB. The more pre-processing I can do at this stage to get the persona and intellectual quality of the memories correct, then the less I have to do at runtime. Even though text chatbot are a lot more forgiving than voice chatbots, latency will become an increasing concern as I increase the complexity of my Graph, so I want to do as much as possible in the ETL stage.

At runtime, when a user submits a query, I'll use some sort of query-expansion technique, and then use that expanded query to retrieve relevant memories. These memories will be used to augment the chatbots response with the goal of responding to technical questions using the same sources and topics that the real-life Connor is plugged into.

Most likely, I'll also use some sort of classification methodology so that only relevant technical queries are routed to this more complex RAG system, and non-technical queries will continue to by generated via the existing Graph implementation. This type of quick routing at the beginning of a Graph can decrease average latency and also reduce costs by limiting the number of LLM calls. I'll also look for opportunities to implement parallelization!

## What's missing?

First, any type of testing. I believe that unit tests save headaches later. Professional code needs unit tests. And if you're in something like a microservice environment, you really need integration tests and e2e tests as well. This is definitely an area for improvement in this project.

Second: **evaluation**. I think data-driven optimizations are going to be critical to improving AI systems. There are some cool open-source frameworks like RAGAS out there, and I'd like to move towards implementing one in this project. Right now, I'm beholden to subjective analysis of how changes to my Graph and Prompting improve responses. When there is a lot of low-hanging fruit, I think you can be pretty confident with subjective judgments. As things get more sophisticated, you need data-driven evaluations.

## Can I run this locally?

Yes, if you really want to. You can run this locally with Tilt, which is a local microservice development environment for Kubernetes.

Clone the repo, fill out the `secrets-dev.example.yaml` with the relevant fields and you'll be good to go by running `tilt up`.

Alternatively, you can run a local server for the backend with `poetry run start` and the frontend with `npm run dev`. You'll need to setup .env files for both, that mirror `secrets-dev.example`.
