import Link from "next/link";
import type { SkillSummary } from "@/lib/api";
import { TagChip } from "./TagChip";

export function SkillCard({ skill }: { skill: SkillSummary }) {
  return (
    <Link href={`/skills/${encodeURIComponent(skill.name)}`}>
      <div className="group rounded-lg border border-white/10 bg-white/5 p-5 transition-all hover:border-onxza-blue/50 hover:bg-white/[0.08]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white group-hover:text-onxza-blue transition-colors">
            {skill.name}
          </h3>
          <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-gray-400">
            v{skill.version}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-400 line-clamp-2">
          {skill.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill.tags?.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>by {skill.author}</span>
          <span>
            {new Date(skill.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
