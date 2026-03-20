const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.onxza.com";

export interface SkillSummary {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SkillVersion {
  version: string;
  published_at: string;
  publisher_username: string;
}

export interface SkillDetail {
  name: string;
  description: string;
  author: string;
  tags: string[];
  latest_version: string;
  download_url: string;
  metadata: Record<string, unknown>;
  versions: SkillVersion[];
  published_at: string;
}

export interface SkillsListResponse {
  skills: SkillSummary[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchSkills(params: {
  q?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<SkillsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(
    `${API_URL}/api/v1/skills?${searchParams.toString()}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchSkill(name: string): Promise<SkillDetail> {
  const res = await fetch(`${API_URL}/api/v1/skills/${encodeURIComponent(name)}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Skill not found");
    }
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
