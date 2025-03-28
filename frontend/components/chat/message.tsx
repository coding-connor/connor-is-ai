import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import "./message.css";

export interface MessageTextProps {
  content: string;
}

export function AIMessageText(props: MessageTextProps) {
  return (
    <div className="flex mr-auto w-fit max-w-[700px] bg-gray-200 rounded-md px-2 py-1">
      <div className="text-normal text-gray-800 text-left break-words">
        <Markdown
          className="max-w-[650px]"
          remarkPlugins={[remarkGfm]}
          children={props.content}
          components={{
            a: ({ node, ...props }) => <a {...props} className="my-2" />,
            blockquote: ({ node, ...props }) => (
              <blockquote {...props} className="my-2" />
            ),
            br: ({ node, ...props }) => <br {...props} className="my-2" />,
            em: ({ node, ...props }) => <em {...props} className="my-2" />,
            h1: ({ node, ...props }) => (
              <h1 {...props} className="my-2 text-3xl font-bold" />
            ),
            h2: ({ node, ...props }) => (
              <h2 {...props} className="my-2 text-2xl font-bold" />
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props} className="my-2 text-xl font-bold" />
            ),
            h4: ({ node, ...props }) => (
              <h4 {...props} className="my-2 text-lg font-bold" />
            ),
            h5: ({ node, ...props }) => (
              <h5 {...props} className="my-2 text-base font-bold" />
            ),
            h6: ({ node, ...props }) => (
              <h6 {...props} className="my-2 text-sm font-bold" />
            ),
            hr: ({ node, ...props }) => <hr {...props} className="my-2" />,
            img: ({ node, ...props }) => <img {...props} className="my-2" />,
            li: ({ node, ...props }) => <li {...props} className="my-2" />,
            ol: ({ node, ...props }) => <ol {...props} className="my-2" />,
            p: ({ node, ...props }) => <p {...props} className="my-2" />,
            pre: ({ node, ...props }) => <pre {...props} className="my-2" />,
            strong: ({ node, ...props }) => (
              <strong {...props} className="my-2" />
            ),
            ul: ({ node, ...props }) => <ul {...props} className="my-2" />,
            code: (props) => {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter language={match[1]} PreTag="div">
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className}>{children}</code>
              );
            },
          }}
        />
      </div>
    </div>
  );
}

export function HumanMessageText(props: MessageTextProps) {
  return (
    <div className="flex ml-auto w-fit max-w-[700px] bg-blue-400 rounded-md px-2 py-1">
      <p className="my-1 text-normal text-gray-50 text-left break-words">
        {props.content}
      </p>
    </div>
  );
}

export function LoadingMessage() {
  return (
    <svg height="40" width="40" className="loader bg-gray-200 rounded-md">
      <circle className="dot" cx="10" cy="20" r="3" style={{ fill: "grey" }} />
      <circle className="dot" cx="20" cy="20" r="3" style={{ fill: "grey" }} />
      <circle className="dot" cx="30" cy="20" r="3" style={{ fill: "grey" }} />
    </svg>
  );
}
