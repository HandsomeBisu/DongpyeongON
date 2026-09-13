import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`markdown-content ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
        components={{
          a: ({ children, href }) => <a href={href} rel="noreferrer" target="_blank">{children}</a>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
