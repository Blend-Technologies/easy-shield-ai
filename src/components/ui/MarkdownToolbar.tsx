import {
  Bold, Italic, Strikethrough,
  Heading1, Heading2, Heading3, Heading4,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
  Quote, Code, Code2,
  Minus, Link, RemoveFormatting,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  palette?: { primary: string; border: string; bg?: string };
}

type FormatAction =
  | "bold" | "italic" | "strikethrough"
  | "h1" | "h2" | "h3" | "h4"
  | "align-left" | "align-center" | "align-right" | "align-justify"
  | "ul" | "ol"
  | "blockquote" | "code" | "codeblock"
  | "hr" | "link" | "clear";

// ── Apply markdown formatting to a textarea ───────────────────────────────────
function applyFormat(
  el: HTMLTextAreaElement,
  onChange: (v: string) => void,
  action: FormatAction,
) {
  const { value, selectionStart: ss, selectionEnd: se } = el;
  const selected = value.slice(ss, se);
  const before = value.slice(0, ss);
  const after = value.slice(se);

  // Helper: find start of current line
  const lineStart = before.lastIndexOf("\n") + 1;

  // Helper: apply inline wrap (bold, italic, etc.)
  const wrap = (marker: string) => {
    const inner = selected || "text";
    const newVal = `${before}${marker}${inner}${marker}${after}`;
    const newStart = ss + marker.length;
    const newEnd = newStart + inner.length;
    return { newVal, newStart, newEnd };
  };

  // Find the end of the line at position p
  const lineEndAt = (p: number) => {
    const idx = value.indexOf("\n", p);
    return idx === -1 ? value.length : idx;
  };

  // Extend the selection to cover full lines (start of first line → end of last line)
  const blockStart = lineStart;
  const blockEnd = se > ss ? lineEndAt(se - 1) : lineEndAt(ss);

  // Ensure a blank line exists immediately before/after the block
  const addBlankBefore = (before: string) =>
    before.length > 0 && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const addBlankAfter = (after: string) =>
    after.length > 0 && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";

  // Helper: prefix each selected line
  const prefixLines = (prefix: string) => {
    const textBefore = value.slice(0, blockStart);
    const textAfter  = value.slice(blockEnd);
    const block      = value.slice(blockStart, blockEnd);

    const prefixed = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");

    const gap1 = addBlankBefore(textBefore);
    const gap2 = addBlankAfter(textAfter);
    const newVal = textBefore + gap1 + prefixed + gap2 + textAfter;
    const newStart = blockStart + gap1.length;
    return { newVal, newStart, newEnd: newStart + prefixed.length };
  };

  // Helper: prefix each selected line with ordered numbers
  const prefixOrderedLines = () => {
    const textBefore = value.slice(0, blockStart);
    const textAfter  = value.slice(blockEnd);
    const block      = value.slice(blockStart, blockEnd);

    let counter = 1;
    const prefixed = block
      .split("\n")
      .map((l) => {
        if (/^\d+\.\s/.test(l)) { counter++; return l; } // already numbered — skip
        return `${counter++}. ${l}`;
      })
      .join("\n");

    const gap1 = addBlankBefore(textBefore);
    const gap2 = addBlankAfter(textAfter);
    const newVal = textBefore + gap1 + prefixed + gap2 + textAfter;
    const newStart = blockStart + gap1.length;
    return { newVal, newStart, newEnd: newStart + prefixed.length };
  };

  // Helper: block-level heading prefix on current line only
  const headingPrefix = (hashes: string) => {
    const lineEnd = value.indexOf("\n", ss);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const line = value.slice(lineStart, end);
    const stripped = line.replace(/^#{1,6}\s*/, "");
    const newLine = `${hashes} ${stripped}`;
    const newVal = value.slice(0, lineStart) + newLine + value.slice(end);
    const newEnd = lineStart + newLine.length;
    return { newVal, newStart: lineStart, newEnd };
  };

  // Helper: wrap block with HTML align div
  const alignBlock = (dir: "center" | "right" | "left" | "justify") => {
    const inner = selected || "text";
    if (dir === "left") {
      // Remove alignment wrappers if present
      const cleaned = inner.replace(/<div align="(?:center|right|justify)">\n\n?/g, "").replace(/\n?\n?<\/div>/g, "");
      const newVal = `${before}${cleaned}${after}`;
      return { newVal, newStart: ss, newEnd: ss + cleaned.length };
    }
    const newInner = `<div align="${dir}">\n\n${inner}\n\n</div>`;
    const newVal = `${before}${newInner}${after}`;
    return { newVal, newStart: ss + `<div align="${dir}">\n\n`.length, newEnd: ss + `<div align="${dir}">\n\n`.length + inner.length };
  };

  let result: { newVal: string; newStart: number; newEnd: number };

  switch (action) {
    case "bold":          result = wrap("**"); break;
    case "italic":        result = wrap("*"); break;
    case "strikethrough": result = wrap("~~"); break;
    case "h1":            result = headingPrefix("#"); break;
    case "h2":            result = headingPrefix("##"); break;
    case "h3":            result = headingPrefix("###"); break;
    case "h4":            result = headingPrefix("####"); break;
    case "align-left":    result = alignBlock("left"); break;
    case "align-center":  result = alignBlock("center"); break;
    case "align-right":   result = alignBlock("right"); break;
    case "align-justify": result = alignBlock("justify"); break;
    case "ul":            result = prefixLines("- "); break;
    case "ol":            result = prefixOrderedLines(); break;
    case "blockquote":    result = prefixLines("> "); break;
    case "code": {
      const inner = selected || "code";
      const newVal = `${before}\`${inner}\`${after}`;
      result = { newVal, newStart: ss + 1, newEnd: ss + 1 + inner.length };
      break;
    }
    case "codeblock": {
      const inner = selected || "code";
      const newVal = `${before}\`\`\`\n${inner}\n\`\`\`${after}`;
      result = { newVal, newStart: ss + 4, newEnd: ss + 4 + inner.length };
      break;
    }
    case "hr": {
      const sep = "\n\n---\n\n";
      const newVal = `${before}${sep}${after}`;
      result = { newVal, newStart: ss + sep.length, newEnd: ss + sep.length };
      break;
    }
    case "link": {
      const text = selected || "link text";
      const insertion = `[${text}](url)`;
      const newVal = `${before}${insertion}${after}`;
      result = { newVal, newStart: ss + text.length + 3, newEnd: ss + text.length + 3 + 3 }; // select "url"
      break;
    }
    case "clear": {
      // Strip common markdown from selection
      const cleaned = selected
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/~~(.+?)~~/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^[-*]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/^>\s+/gm, "")
        .replace(/<div align="(?:center|right|left|justify)">\n\n?/g, "")
        .replace(/\n?\n?<\/div>/g, "");
      const newVal = `${before}${cleaned}${after}`;
      result = { newVal, newStart: ss, newEnd: ss + cleaned.length };
      break;
    }
    default:
      return;
  }

  onChange(result.newVal);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(result.newStart, result.newEnd);
  });
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({
  icon: Icon,
  label,
  action,
  textareaRef,
  onChange,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  action: FormatAction;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // don't steal focus from textarea
            if (textareaRef.current) {
              applyFormat(textareaRef.current, onChange, action);
            }
          }}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none"
          style={{ "--tw-accent": accentColor } as React.CSSProperties}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

const Sep = () => <div className="w-px h-4 bg-border mx-0.5 self-center" />;

// ── Main toolbar ──────────────────────────────────────────────────────────────
export function MarkdownToolbar({ textareaRef, onChange, palette }: MarkdownToolbarProps) {
  const accent = palette?.primary;
  const btnProps = { textareaRef, onChange, accentColor: accent };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1 rounded-t-lg border border-b-0 border-input bg-muted/40 select-none"
      style={palette ? { borderColor: palette.border } : undefined}
    >
      {/* Headings */}
      <ToolBtn icon={Heading1} label="Heading 1 (large title)" action="h1" {...btnProps} />
      <ToolBtn icon={Heading2} label="Heading 2 (section title)" action="h2" {...btnProps} />
      <ToolBtn icon={Heading3} label="Heading 3 (subsection)" action="h3" {...btnProps} />
      <ToolBtn icon={Heading4} label="Heading 4 (small heading)" action="h4" {...btnProps} />

      <Sep />

      {/* Inline format */}
      <ToolBtn icon={Bold}          label="Bold"          action="bold"          {...btnProps} />
      <ToolBtn icon={Italic}        label="Italic"        action="italic"        {...btnProps} />
      <ToolBtn icon={Strikethrough} label="Strikethrough" action="strikethrough" {...btnProps} />

      <Sep />

      {/* Alignment */}
      <ToolBtn icon={AlignLeft}    label="Align left (remove alignment)"  action="align-left"    {...btnProps} />
      <ToolBtn icon={AlignCenter}  label="Align center"                    action="align-center"  {...btnProps} />
      <ToolBtn icon={AlignRight}   label="Align right"                     action="align-right"   {...btnProps} />
      <ToolBtn icon={AlignJustify} label="Justify"                         action="align-justify" {...btnProps} />

      <Sep />

      {/* Lists */}
      <ToolBtn icon={List}        label="Bullet list"   action="ul" {...btnProps} />
      <ToolBtn icon={ListOrdered} label="Numbered list" action="ol" {...btnProps} />

      <Sep />

      {/* Blocks */}
      <ToolBtn icon={Quote}  label="Blockquote"      action="blockquote" {...btnProps} />
      <ToolBtn icon={Code}   label="Inline code"     action="code"       {...btnProps} />
      <ToolBtn icon={Code2}  label="Code block"      action="codeblock"  {...btnProps} />
      <ToolBtn icon={Minus}  label="Horizontal rule" action="hr"         {...btnProps} />

      <Sep />

      {/* Link & clear */}
      <ToolBtn icon={Link}              label="Insert link"      action="link"  {...btnProps} />
      <ToolBtn icon={RemoveFormatting}  label="Clear formatting" action="clear" {...btnProps} />
    </div>
  );
}
