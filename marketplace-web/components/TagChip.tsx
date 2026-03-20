import Link from "next/link";

export function TagChip({
  tag,
  clickable = true,
}: {
  tag: string;
  clickable?: boolean;
}) {
  const className =
    "inline-block rounded-full bg-onxza-blue/10 px-2.5 py-0.5 text-xs font-medium text-onxza-blue transition-colors hover:bg-onxza-blue/20";

  if (clickable) {
    return (
      <Link href={`/search?q=${encodeURIComponent(tag)}`} className={className}>
        {tag}
      </Link>
    );
  }

  return <span className={className}>{tag}</span>;
}
