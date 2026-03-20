"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({
  page,
  total,
  limit,
  basePath = "/search",
}: {
  page: number;
  total: number;
  limit: number;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-4 pt-8">
      <button
        onClick={() => navigate(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-onxza-blue/50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => navigate(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-onxza-blue/50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
