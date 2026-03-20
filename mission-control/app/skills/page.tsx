/**
 * Skill Library Manager — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

interface Skill {
  name: string;
  description: string;
  hasSkillMd: boolean;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then((d) => setSkills(d.skills || []))
      .catch(() => {});
  }, []);

  const filtered = skills.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Skill Library</h1>
      <input
        className="w-full max-w-md bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600 mb-6"
        placeholder="Search skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((skill) => (
          <div key={skill.name} className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-cyan-400">{skill.name}</span>
              <span className={`w-2 h-2 rounded-full ${skill.hasSkillMd ? 'bg-green-400' : 'bg-gray-600'}`} title={skill.hasSkillMd ? 'SKILL.md present' : 'No SKILL.md'} />
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{skill.description || 'No description'}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">No skills found</div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-600">{skills.length} skills installed</div>
    </div>
  );
}
