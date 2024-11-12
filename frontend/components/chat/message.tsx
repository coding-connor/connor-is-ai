import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";

export interface MessageTextProps {
  content: string;
}

export function AIMessageText(props: MessageTextProps) {
  return (
    <div className="flex mr-auto w-fit max-w-[700px] bg-gray-200 rounded-md px-2 py-1 mt-3">
      <div className="text-normal text-gray-800 text-left break-words">
        <Markdown
          className="max-w-[650px]"
          remarkPlugins={[remarkGfm]}
          children={props.content}
          components={{
            a: ({ node, ...props }) => <a {...props} className="mt-2" />,
            blockquote: ({ node, ...props }) => (
              <blockquote {...props} className="mt-2" />
            ),
            br: ({ node, ...props }) => <br {...props} className="mt-2" />,
            em: ({ node, ...props }) => <em {...props} className="mt-2" />,
            h1: ({ node, ...props }) => (
              <h1 {...props} className="mt-2 text-3xl font-bold" />
            ),
            h2: ({ node, ...props }) => (
              <h2 {...props} className="mt-2 text-2xl font-bold" />
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props} className="mt-2 text-xl font-bold" />
            ),
            h4: ({ node, ...props }) => (
              <h4 {...props} className="mt-2 text-lg font-bold" />
            ),
            h5: ({ node, ...props }) => (
              <h5 {...props} className="mt-2 text-base font-bold" />
            ),
            h6: ({ node, ...props }) => (
              <h6 {...props} className="mt-2 text-sm font-bold" />
            ),
            hr: ({ node, ...props }) => <hr {...props} className="mt-2" />,
            img: ({ node, ...props }) => <img {...props} className="mt-2" />,
            li: ({ node, ...props }) => <li {...props} className="mt-2" />,
            ol: ({ node, ...props }) => <ol {...props} className="mt-2" />,
            p: ({ node, ...props }) => <p {...props} className="mt-2" />,
            pre: ({ node, ...props }) => <pre {...props} className="mt-2" />,
            strong: ({ node, ...props }) => (
              <strong {...props} className="mt-2" />
            ),
            ul: ({ node, ...props }) => <ul {...props} className="mt-2" />,
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
      <p className="text-normal text-gray-50 text-left break-words">
        {props.content}
      </p>
    </div>
  );
}
