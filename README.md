# Connor's Personal Representative

I am personal representative of Connor, tailored for professional interview-style questions.

### Use me like:

- You're a recruiter talking to Connor.
- You are a hiring manager talking to Connor.

### Ask me:

- About my coding skills
- My past work experience
- My education

### Tech Stack:

- **LangGraph**
- **LangChain**
- **LangSmith**
- **OpenAI**
- **Supabase PgVector**
- **Next.js**
- **React**
- **Shadcn**
- **Tailwind**
- **Clerk**

### Backend

The backend is an agential RAG application, built with LangGraph and LangChain. It currently runs with OpenAI ChatGPT 4o.

#### System Prompt

The system prompt defines the basics of my biography and personality, allowing the AI representative to accurately reflect Connor.

It also defines the goals of the conversation:

- Answer questions asked of it
- Learn about the interlocutor's work + if they are hiring
- Get the interlocutor to sign up for a meeting with the real Connor

#### Memory

The active conversation is including in the context sent to the LLM.

Once a conversation is finished, several things happen:

- The conversation history is stored for the user (based on the email address used for login)
- The user profile is updated based on the conversation, which gets included in the system prompt for any return users.
- An LLM splits the conversation into documents based on the questions asked. A human-in-the-loop queue is formed, where Connor reviews each of these documents, and appropriate answers are uploaded to the Learnings vector database for retrieval for future conversations. (This surfaces new questions asked to Connor, who can then make sure his answers to these questions are best configured for the AI representative in the future.)

#### Agent Tools

- The primary AI Agent has at its disposal several tools to enrich the conversation:
  -- It can search the web for additional helpful context when answering questions
  -- It can use the calendly tool to create a UI wiget wherein the user can sign up for a call with the real Connor

#### Retrieval

Vector database retrieval is Kn retrieval with reranking based on this paper from Anthropic (insert paper)

#### Embeddings

I'm using a late chunking approach outlined in this paper [to do: insert paper].

## Frontend

The frontend is built with Next.js. I consider myself primarily a backend + AI developer, but coding is coding, and I'm always trying to add to my frontend toolkit. I'm slowly transitioning over from building with Angular to React / Next.js. This project is my first React frontend I've built in several years. It's based on a frontend template from a LangChain tutorial. It uses Shadcn, and Tailwind. Overall, it's pretty simple. It's basically a chatbot.

Login is handled with Clerk.

## Agent Evaluation

[TODO] Create an evaluative framework for assessing accuracy of agent replies. This is an important step of any full-stack AI application. It's especially important for iteration. I'm a bit hesitant to put this project out into the wild without this built out, but I'd also like to get hired soon. So here we are. No eval framework yet, but it's coming soon!
