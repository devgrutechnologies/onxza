import { Suspense } from "react";
import { fetchSkills } from "@/lib/api";
import { SkillCard } from "@/components/SkillCard";
import { SearchBar } from "@/components/SearchBar";

async function RecentSkills() {
  try {
    const data = await fetchSkills({ limit: 12 });
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.skills.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </div>
    );
  } catch {
    return (
      <p className="text-center text-gray-500">
        Unable to load skills. Check back soon.
      </p>
    );
  }
}

function SkillsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold text-white">
          ONXZA Skills Marketplace
        </h1>
        <p className="max-w-lg text-gray-400">
          Discover, install, and share AI skills for the ONXZA platform.
        </p>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">
          Recent Skills
        </h2>
        <Suspense fallback={<SkillsGridSkeleton />}>
          <RecentSkills />
        </Suspense>
      </section>
    </div>
  );
}
