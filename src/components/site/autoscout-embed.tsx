"use client";

import { useEffect, useRef } from "react";

/**
 * Injects the AutoScout24 Carportal snippet. innerHTML does not execute
 * <script> tags, so they are re-created element by element. Rendered
 * ONLY inside a <ConsentGate> — never before consent.
 */
export function AutoscoutEmbed({ snippet }: { snippet: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const template = document.createElement("template");
    template.innerHTML = snippet;

    const appendNode = (node: Node, parent: Node) => {
      if (node instanceof HTMLScriptElement) {
        const script = document.createElement("script");
        for (const attr of node.attributes) {
          script.setAttribute(attr.name, attr.value);
        }
        script.text = node.text;
        parent.appendChild(script);
      } else {
        const clone = node.cloneNode(false);
        parent.appendChild(clone);
        node.childNodes.forEach((child) => appendNode(child, clone));
      }
    };

    template.content.childNodes.forEach((node) =>
      appendNode(node, container),
    );

    return () => {
      container.innerHTML = "";
    };
  }, [snippet]);

  return (
    <div
      ref={containerRef}
      className="min-h-64 w-full overflow-x-auto"
      aria-label="Annunci Autostore su AutoScout24"
    />
  );
}
