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
            a: ({ node, ...props }) => <a {...props} />,
            blockquote: ({ node, ...props }) => <blockquote {...props} />,
            br: ({ node, ...props }) => <br {...props} />,
            em: ({ node, ...props }) => <em {...props} />,
            h1: ({ node, ...props }) => (
              <h1 {...props} className="text-3xl font-bold" />
            ),
            h2: ({ node, ...props }) => (
              <h2 {...props} className="text-2xl font-bold" />
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props} className="text-xl font-bold" />
            ),
            h4: ({ node, ...props }) => (
              <h4 {...props} className="text-lg font-bold" />
            ),
            h5: ({ node, ...props }) => (
              <h5 {...props} className="text-base font-bold" />
            ),
            h6: ({ node, ...props }) => (
              <h6 {...props} className="text-sm font-bold" />
            ),
            hr: ({ node, ...props }) => <hr {...props} />,
            img: ({ node, ...props }) => <img {...props} />,
            li: ({ node, ...props }) => <li {...props} />,
            ol: ({ node, ...props }) => <ol {...props} />,
            p: ({ node, ...props }) => <p {...props} />,
            pre: ({ node, ...props }) => <pre {...props} />,
            strong: ({ node, ...props }) => <strong {...props} />,
            ul: ({ node, ...props }) => <ul {...props} />,
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
