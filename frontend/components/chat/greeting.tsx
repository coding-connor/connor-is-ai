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
      "🔍 Ask me to research any topic in depth, and I'll provide comprehensive analysis.",
      "📚 I will search the web for information on any topic.",
      "🤔 I'm based on the LangChain open source deep-research implementation.",
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
