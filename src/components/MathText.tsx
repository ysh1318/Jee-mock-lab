/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";

interface MathTextProps {
  text: string;
  block?: boolean;
  className?: string;
}

export function MathText({ text, block = false, className = "" }: MathTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [katexAvailable, setKatexAvailable] = useState(!!(window as any).katex);

  useEffect(() => {
    if ((window as any).katex) {
      setKatexAvailable(true);
      return;
    }
    const interval = setInterval(() => {
      if ((window as any).katex) {
        setKatexAvailable(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    if (katexAvailable && (window as any).katex) {
      try {
        (window as any).katex.render(text, containerRef.current, {
          throwOnError: false,
          displayMode: block,
          trust: true,
          strict: false,
        });
      } catch (err) {
        containerRef.current.textContent = text;
      }
    } else {
      containerRef.current.textContent = text;
    }
  }, [text, katexAvailable, block]);

  return <span ref={containerRef} className={`${className} inline-block`} />;
}

interface MarkdownMathProps {
  text: string;
  className?: string;
}

function cleanPuaCharacters(str: string): string {
  return str.replace(/[\uf000-\uf0ff]/g, (ch) => {
    const code = ch.charCodeAt(0);
    switch (code) {
      case 0xf028: return "(";
      case 0xf029: return ")";
      case 0xf02b: return "+";
      case 0xf02d: return "-";
      case 0xf03d: return "=";
      case 0xf05b:
      case 0xf0e9:
      case 0xf0eb: return "[";
      case 0xf05d:
      case 0xf0f9:
      case 0xf0fb: return "]";
      case 0xf0b0: return "°";
      case 0xf0b4: return "×";
      case 0xf0ae: return "→";
      default: return "";
    }
  });
}

export function MarkdownMath({ text, className = "" }: MarkdownMathProps) {
  if (!text) return null;

  // 1. Unescape literal newlines and sanitize MathType PUA font symbols
  let processedText = cleanPuaCharacters(text.replace(/\\n/g, "\n"));

  // 2. Only auto-wrap standalone naked LaTeX formulas if the string is NOT English prose
  if (!processedText.includes("$")) {
    const isPureShortFormula =
      !processedText.includes("\n") &&
      !/\b(the|is|are|of|in|to|and|for|with|that|this|from|which|statement|given|below|calculate|find|choose|correct|incorrect|among|following|let|if|then|when|where|what)\b/i.test(processedText) &&
      (/^\\[a-zA-Z]+/.test(processedText.trim()) || (/^[-+0-9a-zA-Z\s\(\)\,\.\/]*[\^\\_][-0-9a-zA-Z\s\(\)\,\.\/\{\}\\]*$/.test(processedText.trim()) && !processedText.includes("___")));

    if (isPureShortFormula) {
      processedText = `$${processedText.trim()}$`;
    }
  }

  // Split text by $$ blocks first
  const displayBlocks = processedText.split("$$");
  
  return (
    <span className={`${className} inline block-math-wrapper`}>
      {displayBlocks.map((blockContent, blockIdx) => {
        // If idx is odd, it was surrounded by $$ and is block mathematical content
        if (blockIdx % 2 === 1) {
          return (
            <div key={`block-${blockIdx}`} className="my-3 text-center overflow-x-auto overflow-y-hidden max-w-full">
              <MathText text={blockContent} block={true} />
            </div>
          );
        }

        // If idx is even, parse standard inline $ math blocks
        const inlineBlocks = blockContent.split("$");
        return (
          <span key={`inline-wrapper-${blockIdx}`}>
            {inlineBlocks.map((segment, inlineIdx) => {
              // If inlineIdx is odd, it was surrounded by $ and is inline math
              if (inlineIdx % 2 === 1) {
                // Ensure no empty segments
                if (!segment.trim()) return null;
                return (
                  <span key={`inline-${blockIdx}-${inlineIdx}`} className="px-0.5 inline-block align-middle max-w-full overflow-x-auto overflow-y-hidden">
                    <MathText text={segment} block={false} />
                  </span>
                );
              }
              // Normal text
              return <span key={`text-${blockIdx}-${inlineIdx}`} className="whitespace-pre-wrap">{segment}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}
