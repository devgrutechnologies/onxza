"use client";

import { useState } from "react";

export function InstallCommand({ skillName }: { skillName: string }) {
  const [copied, setCopied] = useState(false);
  const command = `onxza skill install ${skillName}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-3">
      <code className="flex-1 font-mono text-sm text-gray-300">
        $ {command}
      </code>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md bg-onxza-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-onxza-blue/80"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
