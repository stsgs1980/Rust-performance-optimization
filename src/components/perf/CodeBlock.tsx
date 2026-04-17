"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code2 } from "lucide-react";

export function CodeBlock({ code, title, variant }: { code: string; title: string; variant: "baseline" | "optimized" }) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const tokenEstimate = Math.round(charCount / 4);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden border border-[#262626] code-block-hover">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#262626] bg-[#0f0f0f]">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="size-3.5 text-[#8a8a8a] shrink-0" />
          <span className="text-xs font-[family-name:var(--font-ibm-mono)] text-[#8a8a8a] truncate">{title}</span>
          <span className="tooltip-container">
            <span className="text-[10px] font-[family-name:var(--font-ibm-mono)] text-[#666666] cursor-help">{lineCount} lines</span>
            <span className="tooltip-content">
              {lineCount} lines · {charCount} chars · ~{tokenEstimate} tokens
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-[#8a8a8a] hover:text-[#d4d4d4] transition-colors p-1"
          >
            {copied ? <Check className="size-3.5 text-[#4ade80]" /> : <Copy className="size-3.5" />}
          </button>
          <span
            className={`text-[10px] font-[family-name:var(--font-ibm-mono)] font-medium uppercase tracking-wider px-2 py-0.5 badge-hover ${
              variant === "baseline"
                ? "text-[#f87171] bg-[#f87171]/10"
                : "text-[#4ade80] bg-[#4ade80]/10"
            }`}
          >
            {variant === "baseline" ? "Baseline" : "Optimized"}
          </span>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto custom-scrollbar bg-[#0d0d0d] code-glow">
        <SyntaxHighlighter
          language="rust"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "#0d0d0d",
            fontSize: "0.8rem",
            lineHeight: "1.5",
            fontFamily: "var(--font-ibm-mono), monospace",
          }}
          showLineNumbers
          lineNumberStyle={{ color: "#666666", minWidth: "2.5em" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
