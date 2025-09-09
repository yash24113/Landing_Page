"use client";

import { useMemo, useState } from "react";

type Props = {
  text?: string;
  /** Lines to show when collapsed */
  lines?: number;
  className?: string;
  /** Only show the toggle if text is longer than this many chars */
  minToggleChars?: number;
  moreLabel?: string;
  lessLabel?: string;
};

export default function ExpandableText({
  text = "",
  lines = 3,
  className = "",
  minToggleChars = 140,
  moreLabel = "Read more →",
  lessLabel = "Read less ↑",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const showToggle = useMemo(
    () => (text?.trim()?.length || 0) > minToggleChars,
    [text, minToggleChars]
  );

  const clampStyle = useMemo(
    () =>
      ({
        display: "-webkit-box",
        WebkitLineClamp: String(lines),
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }) as React.CSSProperties,
    [lines]
  );

  function onToggle(e: React.MouseEvent<HTMLButtonElement>) {
    // important: prevents navigating when this lives inside a <Link>
    e.preventDefault();
    e.stopPropagation();
    setExpanded((v) => !v);
  }

  return (
    <div>
      <p className={className} style={expanded ? undefined : clampStyle}>
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 font-semibold text-blue-700 hover:text-blue-800"
          aria-expanded={expanded}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
