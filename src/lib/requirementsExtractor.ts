export type ExtractedOccurrence = {
  type: "shall" | "must";
  text: string;
  supportingText: string;
  documentName: string;
};

/** Split text into sentence-like segments. */
function segmentText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
  const segments: string[] = [];
  let buf = "";

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    buf += ch;

    // Paragraph break
    if (ch === "\n" && normalized[i + 1] === "\n") {
      if (buf.trim().length > 5) segments.push(buf.trim());
      buf = "";
      i++; // skip second \n
      continue;
    }

    // Sentence end: punctuation followed by space + capital letter
    if (
      (ch === "." || ch === "!" || ch === "?") &&
      normalized[i + 1] === " " &&
      /[A-Z("]/.test(normalized[i + 2] ?? "")
    ) {
      if (buf.trim().length > 5) segments.push(buf.trim());
      buf = "";
      i++; // skip the space
    }
  }

  if (buf.trim().length > 5) segments.push(buf.trim());
  return segments;
}

/** Extract section headings that appear verbatim in the documents. */
export function extractSectionHeadings(
  docs: { name: string; content: string }[],
): string[] {
  const seen = new Set<string>();
  const headings: string[] = [];

  for (const doc of docs) {
    for (const rawLine of doc.content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.length > 120 || seen.has(line)) continue;

      const isNumbered = /^(\d+\.)+\s*\w/.test(line);
      const isAllCaps =
        line.length > 4 &&
        line === line.toUpperCase() &&
        /[A-Z]{3}/.test(line);
      const isKeyword = /^(section|article|chapter|part|appendix)\s/i.test(
        line,
      );

      if (isNumbered || isAllCaps || isKeyword) {
        seen.add(line);
        headings.push(line);
      }
    }
  }

  return headings.slice(0, 60);
}

/** Deterministically find every sentence containing "shall" or "must"
 *  (whole-word match, case-insensitive) across all documents. */
export function extractShallMust(
  docs: { name: string; content: string }[],
): ExtractedOccurrence[] {
  const shallRe = /\bshall\b/i;
  const mustRe = /\bmust\b/i;
  const results: ExtractedOccurrence[] = [];

  for (const doc of docs) {
    const segments = segmentText(doc.content);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const hasShall = shallRe.test(seg);
      const hasMust = mustRe.test(seg);
      if (!hasShall && !hasMust) continue;

      const type: "shall" | "must" = hasShall ? "shall" : "must";

      const before = i > 0 ? segments[i - 1] : "";
      const after = i < segments.length - 1 ? segments[i + 1] : "";
      const supportingText = [before, after]
        .filter(Boolean)
        .join(" ")
        .slice(0, 400);

      results.push({ type, text: seg, supportingText, documentName: doc.name });
    }
  }

  return results;
}
