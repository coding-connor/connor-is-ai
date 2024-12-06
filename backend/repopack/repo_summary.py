import os
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from typing import Optional

REPOPACK_OUTPUT_PATH = "repopack/connor_is_ai_full.txt"
SUMMARY_OUTPUT_PATH = (
    "gen_ui_backend/system_prompts/0_long_context_documents/connor_is_ai_summary.txt"
)
SKELETON_OUTPUT_PATH = (
    "gen_ui_backend/system_prompts/0_long_context_documents/connor_is_ai_skeleton.txt"
)

SUMMARY_INSTRUCTIONS = (
    "Analyze this codebase and generate a comprehensive technical summary following this structure:\n\n"
    "1. OVERVIEW\n"
    "- High-level purpose and main functionality of the system\n"
    "- Target users and use cases\n"
    "- Core technical stack and major dependencies\n"
    "- Key design principles and patterns used\n\n"
    "2. ARCHITECTURE\n"
    "- System components and their responsibilities\n"
    "- Component interaction patterns and data flow\n"
    "- Key interfaces and APIs\n"
    "- Database schema and data models (if applicable)\n"
    "- Authentication and security mechanisms\n\n"
    "3. CODE ORGANIZATION\n"
    "- Directory structure and file organization\n"
    "- Key modules and their purposes\n"
    "- Configuration management approach\n"
    "- Resource locations (assets, templates, etc.)\n\n"
    "4. CORE FUNCTIONALITY\n"
    "- Main features and capabilities\n"
    "- Critical business logic and algorithms\n"
    "- Error handling and logging approach\n"
    "- Performance optimization techniques\n\n"
    "5. INTEGRATION POINTS\n"
    "- External service dependencies\n"
    "- API endpoints (both consumed and exposed)\n"
    "- Message queues or event systems\n"
    "- Caching mechanisms\n\n"
    "6. DEVELOPMENT WORKFLOW\n"
    "- Testing approach and framework usage\n"
    "- Development environment setup\n"
    "- Common development tasks and commands\n"
    "- Known limitations or technical debt\n\n"
    "Format Guidelines:\n"
    "- Use markdown formatting for better readability\n"
    "- Include relevant code snippets for critical components\n"
    "- Use bullet points for lists and features\n"
    "- Highlight important terms using bold or italic formatting\n"
    "- Include section headers for easy navigation\n"
    "- Reference specific file paths when discussing components\n\n"
    "Focus on extracting information that would be most relevant for:\n"
    "- Developers needing to understand and modify the code\n"
    "- Technical leads evaluating the architecture\n"
    "- DevOps engineers managing deployments\n"
    "- QA engineers understanding testable components\n\n"
)

SKELETON_INSTRUCTIONS = (
    "Analyze this codebase and generate a code skeleton that captures the system architecture. "
    "Focus on creating a comprehensive structural view while omitting implementation details:\n\n"
    "1. STRUCTURAL HIERARCHY\n"
    "For each major component (Backend, Frontend, Shared), identify and document:\n"
    "- Core interfaces and protocols\n"
    "- Abstract base classes\n"
    "- Key service definitions\n"
    "- Type definitions and data models\n"
    "- Component hierarchies\n"
    "- Integration points\n\n"
    "2. BACKEND SKELETON\n"
    "Document the following elements:\n"
    "- Data models and their relationships\n"
    "- Service layer interfaces and key methods\n"
    "- External integrations and tool abstractions\n"
    "- API endpoint definitions\n"
    "- Authentication and middleware structures\n"
    "- Utility and helper interfaces\n\n"
    "Example Backend Format:\n"
    "```python\n"
    "class BaseService(Protocol):\n"
    '    """Define core service behavior."""\n'
    "    @abstractmethod\n"
    "    async def process(self) -> None:\n"
    "        pass\n"
    "\n"
    "class UserService(BaseService):\n"
    '    """User management operations."""\n'
    "    async def get_user(self, id: str) -> User:\n"
    "        pass\n"
    "```\n\n"
    "3. FRONTEND SKELETON\n"
    "Document the following elements:\n"
    "- TypeScript interfaces and types\n"
    "- React component hierarchies\n"
    "- Custom hooks and their signatures\n"
    "- State management structures\n"
    "- API client interfaces\n"
    "- Utility functions\n\n"
    "Example Frontend Format:\n"
    "```typescript\n"
    "interface DataModel {\n"
    "    id: string;\n"
    "    // ... other properties\n"
    "}\n"
    "\n"
    "function CustomComponent({ data }: { data: DataModel }) {\n"
    "    return <div>{/* Component structure */}</div>\n"
    "}\n"
    "```\n\n"
    "4. INTEGRATION POINTS\n"
    "Document the following elements:\n"
    "- External service interfaces\n"
    "- API contracts between frontend and backend\n"
    "- Event and message definitions\n"
    "- Third-party tool integrations\n"
    "- Authentication flows\n\n"
    "5. CODE ORGANIZATION\n"
    "Show the hierarchy using this format:\n"
    "```\n"
    "src/\n"
    "  ├── domain/       # Core business logic\n"
    "      ├── models/   # Data structures\n"
    "      ├── services/ # Business services\n"
    "  ├── api/         # External interfaces\n"
    "  └── utils/       # Shared utilities\n"
    "```\n\n"
    "6. FORMATTING GUIDELINES\n"
    "Follow these conventions:\n"
    "- Use proper type hints and generics\n"
    "- Include docstrings for major components\n"
    "- Show async/await patterns where applicable\n"
    "- Define clear interface boundaries\n"
    "- Include important decorators\n"
    "- Show dependency injection patterns\n"
    "- Maintain consistent indentation\n\n"
    "7. WHAT TO EXCLUDE\n"
    "Do not include:\n"
    "- Implementation details\n"
    "- Complex business logic\n"
    "- Configuration values\n"
    "- Inline comments (use docstrings instead)\n"
    "- Test code\n"
    "- Documentation comments\n\n"
    "8. SPECIAL CONSIDERATIONS\n"
    "Address these aspects:\n"
    "- Show both synchronous and asynchronous patterns\n"
    "- Include error handling interfaces\n"
    "- Show generic type constraints\n"
    "- Define event emitters and handlers\n"
    "- Show dependency injection patterns\n"
    "- Include middleware chains\n\n"
)


def read_repopack_output(file_path: str) -> Optional[str]:
    try:
        with open(file_path, "r") as file:
            return file.read()
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None
    except IOError as e:
        print(f"Error reading file {file_path}: {e}")
        return None


def analyze_codebase_with_gpt4o(codebase: str, instruction) -> AIMessage:
    if not codebase:
        return AIMessage(content="No output from repopack to analyze.")
    try:
        model = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_tokens=None)
        messages = [SystemMessage(content=codebase), HumanMessage(content=instruction)]
        response = model.invoke(messages)
        return response
    except Exception as e:
        print(f"Error generating response from GPT-4o: {e}")
        return AIMessage(content="Error generating response from GPT-4o: {e}")


def save_analysis_to_file(analysis: AIMessage, file_path: str) -> None:
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w") as file:
            file.write(
                analysis.content if hasattr(analysis, "content") else str(analysis)
            )
    except IOError as e:
        print(f"Error writing to file {file_path}: {e}")


def main() -> None:
    """
    I'm hitting context window limits for my current spending tier with OpenAI, so I'm unable to include my entire codebase in the context for my chatbot. Instead, I'm generating thorough summaries to include.
    """
    instructions = [
        (SUMMARY_INSTRUCTIONS, SUMMARY_OUTPUT_PATH),
        (SKELETON_INSTRUCTIONS, SKELETON_OUTPUT_PATH),
    ]

    codebase = read_repopack_output(REPOPACK_OUTPUT_PATH)
    if codebase:
        for instruction, output_path in instructions:
            summary = analyze_codebase_with_gpt4o(codebase, instruction)
            save_analysis_to_file(summary, output_path)
    else:
        print("No repopack output to analyze.")


if __name__ == "__main__":
    main()
