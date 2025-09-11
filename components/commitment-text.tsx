// components/commitment-text.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  content?: string | null;
};

export function CommitmentText({ content }: Props) {
  const [aboutUsHtml, setAboutUsHtml] = useState<string | null>(null);

  const fallback =
    "Our commitment to excellence extends beyond product quality to encompass reliable logistics, flexible payment terms, and comprehensive customer support. Whether you’re sourcing fabrics for fast fashion, luxury apparel, or industrial textiles, our team delivers customized solutions.";

  useEffect(() => {
    async function fetchAboutUs() {
      try {
        const res = await fetch("http://localhost:7000/api/aboutus", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const description = json?.data?.aboutUs?.description1;
        if (description && description.trim().length > 0) {
          setAboutUsHtml(description);
        }
      } catch (err) {
        console.error("Error fetching AboutUs:", err);
      }
    }
    fetchAboutUs();
  }, []);

  const finalContent =
    content && content.trim().length > 0
      ? content
      : aboutUsHtml || fallback;

  return (
    <div
      className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: finalContent }}
    />
  );
}
