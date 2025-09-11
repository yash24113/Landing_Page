// components/commitment-text.tsx
type Props = {
  content?: string | null;
};

export function CommitmentText({ content }: Props) {
  const fallback =
    "yash Our commitment to excellence extends beyond product quality to encompass reliable logistics, flexible payment terms, and comprehensive customer support. Whether you’re sourcing fabrics for fast fashion, luxury apparel, or industrial textiles, our team delivers customized solutions.";

  return (
    <p className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
      {content && content.trim().length > 0 ? content : fallback}
    </p>
  );
}
