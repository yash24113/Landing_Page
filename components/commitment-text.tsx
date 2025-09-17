// components/commitment-text.tsx
type Props = {
  html: string;
};

export function CommitmentText({ html }: Props) {
  if (!html) return null;

  return (
    <div
      className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
