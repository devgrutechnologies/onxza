import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSkill } from "@/lib/api";
import { InstallCommand } from "@/components/InstallCommand";
import { TagChip } from "@/components/TagChip";
import { ToriQmdBadge } from "@/components/ToriQmdBadge";

export default async function SkillDetailPage({
  params,
}: {
  params: { name: string };
}) {
  let skill;
  try {
    skill = await fetchSkill(params.name);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{skill.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
            <span>
              by{" "}
              <Link
                href={`/author/${encodeURIComponent(skill.author)}`}
                className="text-onxza-blue hover:underline"
              >
                {skill.author}
              </Link>
            </span>
            <span className="font-mono text-gray-500">
              v{skill.latest_version}
            </span>
          </div>
        </div>
        <ToriQmdBadge />
      </div>

      <div className="mb-8">
        <InstallCommand skillName={skill.name} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Description</h2>
        <p className="text-gray-300 leading-relaxed">{skill.description}</p>
      </section>

      {skill.tags?.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        </section>
      )}

      {skill.versions?.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Version History
          </h2>
          <div className="rounded-lg border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Publisher</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {skill.versions.map((v) => (
                  <tr
                    key={v.version}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-gray-300">
                      {v.version}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {v.publisher_username}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(v.published_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="text-xs text-gray-600">
        Published {new Date(skill.published_at).toLocaleDateString()}
      </div>
    </div>
  );
}
