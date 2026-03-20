#!/usr/bin/env python3
"""
ONXZA LLM Queue — Serialized local LLM access for all agents.

Architecture: Single queue file. Agents enqueue requests, this daemon
processes one at a time. Cloud LLM exceptions: new urgent jobs, jobs
too large for local context, complex reasoning jobs.

Queue file: ~/.openclaw/workspace/projects/onxza/dispatcher/llm_queue.json
Lock file:  ~/.openclaw/workspace/projects/onxza/dispatcher/llm.lock

Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
"""

import os, sys, json, time, datetime, subprocess, fcntl
from pathlib import Path

DISPATCHER_DIR = Path.home() / ".openclaw/workspace/projects/onxza/dispatcher"
QUEUE_FILE     = DISPATCHER_DIR / "llm_queue.json"
LOCK_FILE      = DISPATCHER_DIR / "llm.lock"
LOG_FILE       = DISPATCHER_DIR / "llm_queue.log"
OLLAMA_URL     = "http://localhost:11434/api/generate"

# Agents allowed to skip queue (cloud model, urgent flag, or oversized job)
CLOUD_EXCEPTIONS = ["mg-parent-marcus", "main"]

def log(msg, level="INFO"):
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    line = f"[{ts}] [{level}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def load_queue():
    if not QUEUE_FILE.exists():
        return {"queue": [], "processing": None, "completed": []}
    with open(QUEUE_FILE) as f:
        return json.load(f)

def save_queue(q):
    with open(QUEUE_FILE, "w") as f:
        json.dump(q, f, indent=2)

def enqueue(agent_id: str, request_id: str, prompt: str, model: str = "marcusgear/qwen9b",
            use_cloud: bool = False, context_tokens: int = 0, urgent: bool = False):
    """
    Add a job to the LLM queue.
    use_cloud=True or urgent=True or context_tokens > 32000 → skip queue, use cloud.
    """
    q = load_queue()

    # Exceptions that bypass queue
    skip_queue = use_cloud or urgent or context_tokens > 32000 or agent_id in CLOUD_EXCEPTIONS

    entry = {
        "request_id": request_id,
        "agent_id": agent_id,
        "model": model,
        "prompt": prompt,
        "context_tokens": context_tokens,
        "urgent": urgent,
        "use_cloud": use_cloud or skip_queue,
        "skip_queue": skip_queue,
        "queued_at": datetime.datetime.now().isoformat(),
        "status": "skip_queue" if skip_queue else "queued",
        "position": 0 if skip_queue else len(q["queue"]) + 1
    }

    if skip_queue:
        log(f"BYPASS QUEUE: {agent_id}/{request_id} (urgent={urgent}, cloud={use_cloud}, tokens={context_tokens})")
        # Write directly to output file for agent to pick up
        out_file = DISPATCHER_DIR / f"llm_result_{request_id}.json"
        result = run_ollama(prompt, model if not use_cloud else "cloud", agent_id)
        entry["result"] = result
        entry["completed_at"] = datetime.datetime.now().isoformat()
        with open(out_file, "w") as f:
            json.dump(entry, f)
        return entry

    q["queue"].append(entry)
    save_queue(q)
    log(f"QUEUED: {agent_id}/{request_id} at position {entry['position']}")
    return entry

def run_ollama(prompt: str, model: str, agent_id: str) -> str:
    """Run a prompt through local Ollama. Returns response text."""
    import urllib.request
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_ctx": 8192, "temperature": 0.2}
    }).encode()
    try:
        req = urllib.request.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            return data.get("response", "")
    except Exception as e:
        log(f"Ollama error for {agent_id}: {e}", "ERROR")
        return f"ERROR: {e}"

def process_queue():
    """Process one item from the queue. Called by dispatcher every cycle."""
    # Lock so only one process runs at a time
    lock_fd = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        log("Queue already processing — skip this cycle", "INFO")
        lock_fd.close()
        return

    try:
        q = load_queue()
        if not q["queue"]:
            log("Queue empty")
            return

        job = q["queue"].pop(0)
        q["processing"] = job
        save_queue(q)

        log(f"PROCESSING: {job['agent_id']}/{job['request_id']} model={job['model']}")
        start = time.time()
        result = run_ollama(job["prompt"], job["model"], job["agent_id"])
        elapsed = time.time() - start

        job["result"] = result
        job["completed_at"] = datetime.datetime.now().isoformat()
        job["elapsed_seconds"] = round(elapsed, 1)
        job["status"] = "completed"

        # Write result file for agent to read
        out_file = DISPATCHER_DIR / f"llm_result_{job['request_id']}.json"
        with open(out_file, "w") as f:
            json.dump(job, f, indent=2)

        # Archive in completed
        q["processing"] = None
        q["completed"].append({k: job[k] for k in ["request_id","agent_id","completed_at","elapsed_seconds"]})
        if len(q["completed"]) > 100:
            q["completed"] = q["completed"][-100:]
        save_queue(q)

        log(f"DONE: {job['agent_id']}/{job['request_id']} in {elapsed:.1f}s")

    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        lock_fd.close()

if __name__ == "__main__":
    process_queue()
