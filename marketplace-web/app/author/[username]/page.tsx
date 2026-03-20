import { Suspense } from "react";
import { fetchSkills } from "@/lib/api";
import { SkillCard } from "@/components/SkillCard";
import { Pagination } from "@/components/Pagination";

async function AuthorSkills({
  username,
  page,
}: {
  username: string;
  page: number;
}) {
  try {
    const data = await fetchSkills({ q: username, page, limit: 12 });

    const authorSkills = data.skills.filter(
      (s) => s.author.toLowerCase() === username.toLowerCase()
    );

    if (authorSkills.length === 0) {
      return (
        <p className="py-12 text-center text-gray-500">
          No skills found by this author.
        </p>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authorSkills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
        <Pagination
          page={data.page}
          total={data.total}
          limit={data.limit}
          basePath={`/author/${encodeURIComponent(username)}`}
        />
      </>
    );
  } catch {
    return (
      <p className="text-center text-gray-500">
        Unable to load skills. Please try again.
      </p>
    );
  }
}

export default function AuthorPage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { page?: string };
}) {
  const username = decodeURIComponent(params.username);
  const page = Number(searchParams.page) || 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{username}</h1>
        <p className="mt-1 text-sm text-gray-500">Skills by this author</p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/5"
              />
            ))}
          </div>
        }
      >
        <AuthorSkills username={username} page={page} />
      </Suspense>
    </div>
  );
}
