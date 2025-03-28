"use client";

interface GreetingProps {
  endpoint?: string;
}

export function Greeting({ endpoint = "chat" }: GreetingProps): JSX.Element {
  const suggestions = {
    chat: [
      "🤝 Ask me questions as if you are conducting a screening interview with Connor.",
      "💻 Try asking me about my work history as a software engineer.",
      "🧠 Try asking me about my why I'm excited by building (ethically responsible!) products powered by AI.",
      "📅 Curious? Ask me to schedule a meeting with the real Connor.",
    ],
    "deep-research": [
      "🔍 Enter a topic to research and I'll provide a comprehensive analysis.",
      "📚 I'm based on the LangChain open source deep-research implementation.",
      "🤔 Please be patient while I research your topic! (Give me ~1 minute to think...)",
    ],
  };

  return (
    <div className="border border-gray-500 rounded m-1 p-2 bg-gray-200">
      <ul className="list-none list-inside">
        {suggestions[endpoint as keyof typeof suggestions].map(
          (suggestion, index) => (
            <li key={index} className="mb-2">
              {suggestion}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
