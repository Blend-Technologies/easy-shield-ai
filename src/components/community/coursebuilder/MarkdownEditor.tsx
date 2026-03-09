import { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bold, Code, Eye, Heading1, Heading2, Heading3, Image, Italic, Link, List, ListOrdered, Pencil, Quote, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TOOLBAR_ACTIONS = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**", placeholder: "bold text" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_", placeholder: "italic text" },
  { icon: Code, label: "Inline code", prefix: "`", suffix: "`", placeholder: "code" },
  { type: "separator" as const },
  { icon: Heading1, label: "Heading 1", prefix: "# ", suffix: "", placeholder: "Heading 1", line: true },
  { icon: Heading2, label: "Heading 2", prefix: "## ", suffix: "", placeholder: "Heading 2", line: true },
  { icon: Heading3, label: "Heading 3", prefix: "### ", suffix: "", placeholder: "Heading 3", line: true },
  { type: "separator" as const },
  { icon: List, label: "Bullet list", prefix: "- ", suffix: "", placeholder: "list item", line: true },
  { icon: ListOrdered, label: "Numbered list", prefix: "1. ", suffix: "", placeholder: "list item", line: true },
  { icon: Quote, label: "Blockquote", prefix: "> ", suffix: "", placeholder: "quote", line: true },
  { icon: Minus, label: "Horizontal rule", prefix: "\n---\n", suffix: "", placeholder: "", line: true },
  { type: "separator" as const },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
  { icon: Image, label: "Image", prefix: "![alt](", suffix: ")", placeholder: "image-url" },
] as const;

type ToolbarItem = { icon: any; label: string; prefix: string; suffix: string; placeholder: string; line?: boolean } | { type: "separator" };

const MarkdownEditor = ({ value, onChange, placeholder }: MarkdownEditorProps) => {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || mode !== "write") return;
    el.style.height = "auto";
    el.style.height = Math.max(200, el.scrollHeight) + "px";
  }, [value, mode]);

  const insertMarkdown = useCallback(
    (item: ToolbarItem) => {
      if ("type" in item) return;
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      const text = selected || item.placeholder;

      let insertion: string;
      if (item.line) {
        // Line-level: ensure we start on a new line
        const before = value.slice(0, start);
        const needsNewline = before.length > 0 && !before.endsWith("\n");
        insertion = (needsNewline ? "\n" : "") + item.prefix + text + item.suffix;
      } else {
        insertion = item.prefix + text + item.suffix;
      }

      const newVal = value.slice(0, start) + insertion + value.slice(end);
      onChange(newVal);

      // Restore cursor
      requestAnimationFrame(() => {
        ta.focus();
        const cursorPos = start + (item.line && value.slice(0, start).length > 0 && !value.slice(0, start).endsWith("\n") ? 1 : 0) + item.prefix.length;
        ta.setSelectionRange(cursorPos, cursorPos + text.length);
      });
    },
    [value, onChange]
  );

  const insertCodeBlock = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const lang = "python";
    const code = selected || "# your code here";
    const before = value.slice(0, start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insertion = (needsNewline ? "\n" : "") + "```" + lang + "\n" + code + "\n```\n";
    const newVal = value.slice(0, start) + insertion + value.slice(end);
    onChange(newVal);
  }, [value, onChange]);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 flex-wrap">
        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 mr-2 border-r border-border pr-2">
          <Button
            type="button"
            variant={mode === "write" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setMode("write")}
          >
            <Pencil className="h-3 w-3" /> Write
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>

        {mode === "write" && (
          <>
            {TOOLBAR_ACTIONS.map((item, idx) => {
              if ("type" in item) {
                return <div key={idx} className="w-px h-5 bg-border mx-1" />;
              }
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  title={item.label}
                  onClick={() => insertMarkdown(item)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
            {/* Code block button */}
            <button
              type="button"
              title="Code block"
              onClick={insertCodeBlock}
              className="h-7 px-2 flex items-center gap-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-mono"
            >
              {"</>"}
            </button>
          </>
        )}
      </div>

      {/* Editor / Preview */}
      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Write your content using Markdown...\n\nSupports:\n- **Bold**, _italic_, `code`\n- Code blocks with syntax highlighting\n- Lists, links, images, and more"}
          className="w-full min-h-[200px] p-4 text-sm font-mono text-foreground bg-background resize-none focus:outline-none placeholder:text-muted-foreground"
          spellCheck={false}
        />
      ) : (
        <div className={cn(
          "min-h-[200px] p-4 prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
          "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
          "prose-blockquote:border-primary prose-a:text-primary",
        )}>
          {value ? (
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg !my-3 !text-xs"
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
