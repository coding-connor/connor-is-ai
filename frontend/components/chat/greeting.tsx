"use client";

export function Greeting(): JSX.Element {
  return (
    <div className="border border-gray-500 rounded m-1 p-2 bg-gray-200">
      <ul className="list-none list-inside">
        <li className="mb-2">
          🤝 Ask me questions as if you are conducting a screening interview
          with Connor.
        </li>
        <li className="mb-2">
          💻 Try asking me about my work history as a software engineer.
        </li>
        <li className="mb-2">
          🧠 Try asking me about my why I'm excited by building (ethically
          responsible!) products powered by AI.
        </li>
        <li className="mb-2">
          📅 Curious? Ask me to schedule a meeting with the real Connor.
        </li>
      </ul>
    </div>
  );
}
