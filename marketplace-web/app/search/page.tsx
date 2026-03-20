import { Suspense } from "react";
import { fetchSkills } from "@/lib/api";
import { SkillCard } from "@/components/SkillCard";
import { SearchBar } from "@/components/SearchBar";
import { Pagination } from "@/components/Pagination";

async function SearchResults({
  q,
  page,
}: {
  q: string;
  page: number;
}) {
  try {
    const data = await fetchSkills({ q, page, limit: 12 });

    if (data.skills.length === 0) {
      return (
        <p className="py-12 text-center text-gray-500">
          No skills found{q ? ` for "${q}"` : ""}. Try a different search.
        </p>
      );
    }

    return (
      <>
        <p className="mb-6 text-sm text-gray-500">
          {data.total} skill{data.total !== 1 ? "s" : ""} found
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.skills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
        <Pagination
          page={data.page}
          total={data.total}
          limit={data.limit}
        />
      </>
    );
  } catch {
    return (
      <p className="text-center text-gray-500">
        Unable to load results. Please try again.
      </p>
    );
  }
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q || "";
  const page = Number(searchParams.page) || 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Browse Skills</h1>
        <Suspense>
          <SearchBar defaultValue={q} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/5"
              />
            ))}
          </div>
        }
      >
        <SearchResults q={q} page={page} />
      </Suspense>
    </div>
  );
}
