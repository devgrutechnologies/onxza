#!/usr/bin/env node
/**
 * ONXZA-LLM Training Data Collector
 * Collects raw training candidates from MPI routing decisions, FVP outcomes,
 * and shared learning patterns.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_FILE = path.join(__dirname, 'pipeline-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');

function generateId(source, content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  return `onxza-train-${source}-${hash}`;
}

function readMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function readAllMarkdownInDir(dirPath) {
  const files = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = readMarkdownFile(fullPath);
        if (content) files.push({ file: entry.name, path: fullPath, content });
      }
    }
  } catch (e) {
    // Directory may not exist yet — not an error
  }
  return files;
}

/**
 * SOURCE 1: Collect routing decision candidates from MPI data.
 * In production, this reads from model-performance-index.md entries
 * and routing decision logs. For bootstrap, generates structured examples
 * from the ROUTING-001 and MPI-001 specs.
 */
function collectRoutingDecisions() {
  const records = [];

  // Read the MPI and routing spec for pattern extraction
  const mpiPath = path.join(WORKSPACE_ROOT, 'projects/onxza/faails/MPI-001.md');
  const routingPath = path.join(WORKSPACE_ROOT, 'projects/onxza/faails/ROUTING-001.md');
  const mpiContent = readMarkdownFile(mpiPath);
  const routingContent = readMarkdownFile(routingPath);

  if (!mpiContent || !routingContent) {
    console.warn('[collect] WARNING: MPI or ROUTING spec not found — routing collection skipped');
    return records;
  }

  // Read live MPI data if available
  const mpiDataPath = path.join(WORKSPACE_ROOT, 'shared-learnings/DTP/onxza/model-performance-index.md');
  const mpiData = readMarkdownFile(mpiDataPath);

  // Bootstrap seed examples derived from MODEL_ROUTING.md patterns
  const modelRoutingPath = path.join(WORKSPACE_ROOT, 'MODEL_ROUTING.md');
  const modelRouting = readMarkdownFile(modelRoutingPath);

  if (modelRouting) {
    // Extract routing patterns as seed training examples
    const routingExamples = [
      {
        task_type: 'research',
        task_description: 'Generate prospect research summary and email draft for outreach',
        model_selected: 'local_llm_9b',
        fvp_result: 'pass',
        confidence_score: 82,
        loop_count: 1,
        was_optimal: true,
        reasoning: 'Task requires summarization and writing within a 128k context window. Local 9B model is sufficient — fast, zero cost, good enough quality for Tier 1 tasks.',
        decision: 'Route to local LLM (9B). Rationale: Summarization and email generation are Tier 1 tasks. Local model handles context well. No API cost.'
      },
      {
        task_type: 'code_generation',
        task_description: 'Generate a Node.js script to parse JSONL training data and validate schema',
        model_selected: 'local_llm_code',
        fvp_result: 'pass',
        confidence_score: 88,
        loop_count: 1,
        was_optimal: true,
        reasoning: 'Code generation task with clear requirements. A code-tuned local LLM handles this without API cost. Tier 1 task.',
        decision: 'Route to local code LLM. Rationale: Clear, bounded code task. Code-tuned model outperforms general model here. Zero cost.'
      },
      {
        task_type: 'analysis',
        task_description: 'Analyze affiliate program performance data and produce strategic recommendations',
        model_selected: 'grok_3_mini',
        fvp_result: 'pass',
        confidence_score: 79,
        loop_count: 2,
        was_optimal: false,
        reasoning: 'Analysis with strategic output requires reasoning quality above Tier 1. Grok-3-mini is appropriate — better quality than local, lower cost than Claude. Second loop needed for confidence refinement.',
        decision: 'Route to Grok-3-mini. Rationale: Strategic analysis needs better model than local. Grok-3-mini is cost-effective middle tier.'
      },
      {
        task_type: 'routing',
        task_description: 'Determine optimal model for a task involving legal document summarization with accuracy requirements',
        model_selected: 'claude_haiku',
        fvp_result: 'pass',
        confidence_score: 91,
        loop_count: 1,
        was_optimal: true,
        reasoning: 'Legal accuracy requirements make this a Tier 3 task. Local and mid-tier models risk hallucination. Claude Haiku provides reliability at lowest Claude cost point.',
        decision: 'Route to Claude Haiku. Rationale: Accuracy-critical task. Risk of hallucination too high for local or Grok. Claude Haiku is cheapest reliable option.'
      },
      {
        task_type: 'content_writing',
        task_description: 'Write a 1500-word blog post about travel destinations for SEO publication',
        model_selected: 'local_llm_27b',
        fvp_result: 'pass',
        confidence_score: 85,
        loop_count: 1,
        was_optimal: true,
        reasoning: 'Long-form content writing benefits from larger local model context. 27B model produces better quality writing than 9B for this length. Still zero API cost.',
        decision: 'Route to local LLM (27B). Rationale: Long-form content needs better quality. 27B local model provides it at zero cost.'
      }
    ];

    for (const example of routingExamples) {
      const content = JSON.stringify(example);
      const record = {
        id: generateId('routing', content),
        source: 'routing',
        version: '1.0',
        created_at: new Date().toISOString(),
        input: {
          instruction: `Given this task, determine the optimal model routing decision. Explain your reasoning.`,
          context: `Task: ${example.task_description}\nTask type: ${example.task_type}`,
          task_type: example.task_type
        },
        output: {
          reasoning: example.reasoning,
          decision: example.decision,
          confidence: example.confidence_score
        },
        metadata: {
          source: 'routing',
          fvp_result: example.fvp_result,
          loop_count: example.loop_count,
          was_optimal: example.was_optimal,
          anonymized: false, // Will be set true after anonymization pass
          anonymization_pass: null
        }
      };
      records.push(record);
    }
  }

  // If live MPI data exists, extract additional examples
  if (mpiData) {
    console.log('[collect] MPI data found — extracting live routing examples');
    // Live MPI parsing would be implemented here as data accumulates
    // Format: parse table rows or structured log entries from model-performance-index.md
  }

  console.log(`[collect] Routing: ${records.length} candidates collected`);
  return records;
}

/**
 * SOURCE 2: Collect FVP outcome candidates.
 * Reads FVP spec and any logged verification outcomes.
 */
function collectFvpOutcomes() {
  const records = [];

  const fvpPath = path.join(WORKSPACE_ROOT, 'projects/onxza/faails/FVP-001.md');
  const fvpContent = readMarkdownFile(fvpPath);

  if (!fvpContent) {
    console.warn('[collect] WARNING: FVP spec not found — FVP collection skipped');
    return records;
  }

  // Seed examples derived from FVP protocol patterns
  const fvpExamples = [
    {
      task_type: 'content_writing',
      output_summary: 'Blog post draft about travel destination, 1400 words, SEO-optimized',
      confidence_score: 85,
      humanization_pass: true,
      accuracy_pass: true,
      loop_count: 1,
      final_outcome: 'accepted',
      failure_reason: null,
      reasoning: 'Confidence >= 70, output passes humanization check (reads naturally, no AI tells), factually accurate and aligned with content brief. First-pass acceptance.',
      decision: 'ACCEPT. All FVP steps passed on first attempt. High confidence, natural writing, accurate content.'
    },
    {
      task_type: 'code_generation',
      output_summary: 'Python script for data parsing, 80 lines, no comments, variable names unclear',
      confidence_score: 72,
      humanization_pass: false,
      accuracy_pass: true,
      loop_count: 2,
      final_outcome: 'accepted',
      failure_reason: null,
      reasoning: 'Confidence >= 70, passes Step 1. Step 2 fails — code lacks comments and has unclear variable names, does not meet readability standard. Loop back once. Second attempt adds documentation and cleaner naming. Step 2 passes on retry. Step 3 passes (accurate logic).',
      decision: 'LOOP BACK on humanization check. Request: add inline comments, rename variables for clarity. Re-verify after correction.'
    },
    {
      task_type: 'analysis',
      output_summary: 'Financial analysis report with a calculation error in revenue projection',
      confidence_score: 68,
      humanization_pass: true,
      accuracy_pass: false,
      loop_count: 2,
      final_outcome: 'accepted',
      failure_reason: null,
      reasoning: 'Confidence 68 < 70 — loop back immediately at Step 1. Second attempt achieves 81. Passes Step 2 (clean, readable analysis). Step 3 finds revenue projection error — loop back. Third attempt corrects calculation. Accepted on third pass.',
      decision: 'LOOP BACK at Step 1 (confidence too low). After retry: LOOP BACK at Step 3 (calculation error in revenue projection). Flag for correction.'
    },
    {
      task_type: 'routing',
      output_summary: 'Routing decision for a legal document review task — recommended local LLM',
      confidence_score: 75,
      humanization_pass: true,
      accuracy_pass: false,
      loop_count: 3,
      final_outcome: 'escalated',
      failure_reason: 'Routing recommendation inconsistent with accuracy requirements of task',
      reasoning: 'Output passes Steps 1 and 2. Step 3 fails — routing a legal accuracy task to local LLM violates accuracy standards. Loop back. Retry still recommends insufficient model. Loop back again. Third attempt still incorrect. Max loops reached — escalate to PM.',
      decision: 'ESCALATE. Three loops completed without passing accuracy check. PM review required. Issue: agent consistently under-routes accuracy-critical tasks.'
    },
    {
      task_type: 'research',
      output_summary: 'Market research summary with high factual accuracy, sourced from verified data',
      confidence_score: 91,
      humanization_pass: true,
      accuracy_pass: true,
      loop_count: 1,
      final_outcome: 'accepted',
      failure_reason: null,
      reasoning: 'Confidence 91 — well above threshold. Natural, readable summary. All facts verified against source data. Vision-aligned. First-pass acceptance.',
      decision: 'ACCEPT. Excellent first-pass quality. Confidence high, humanization clean, accuracy verified.'
    }
  ];

  for (const example of fvpExamples) {
    const content = JSON.stringify(example);
    const record = {
      id: generateId('fvp', content),
      source: 'fvp',
      version: '1.0',
      created_at: new Date().toISOString(),
      input: {
        instruction: `Apply the FAAILS Verification Protocol to evaluate this agent output. Determine if it passes, requires a loop-back, or must be escalated.`,
        context: `Task type: ${example.task_type}\nOutput: ${example.output_summary}\nAgent confidence: ${example.confidence_score}/100`,
        task_type: example.task_type
      },
      output: {
        reasoning: example.reasoning,
        decision: example.decision,
        confidence: example.confidence_score
      },
      metadata: {
        source: 'fvp',
        fvp_result: example.final_outcome === 'accepted' ? 'pass' : example.final_outcome,
        loop_count: example.loop_count,
        was_optimal: example.loop_count === 1 && example.final_outcome === 'accepted',
        anonymized: false,
        anonymization_pass: null
      }
    };
    records.push(record);
  }

  console.log(`[collect] FVP: ${records.length} candidates collected`);
  return records;
}

/**
 * SOURCE 3: Collect shared learning pattern candidates.
 */
function collectSharedLearnings() {
  const records = [];
  const patternDirs = [
    path.join(WORKSPACE_ROOT, 'shared-learnings/global/patterns'),
    path.join(WORKSPACE_ROOT, 'shared-learnings/DTP'),
    path.join(WORKSPACE_ROOT, 'shared-learnings/DTP/onxza')
  ];

  // Collect pattern files
  const patternFiles = [];
  for (const dir of patternDirs) {
    const files = readAllMarkdownInDir(dir);
    patternFiles.push(...files);
  }

  // Known high-value patterns to seed training
  const seedPatterns = [
    {
      pattern_name: 'fvp-loop-threshold',
      pattern_type: 'verification',
      context: 'Agent receives output for verification. Confidence score is below 70.',
      recommended_action: 'Do not proceed to humanization or accuracy checks. Loop back immediately. Increment loop count. Request agent revise with explicit confidence improvement target.',
      outcome_quality: 'high',
      reasoning: 'Proceeding with low-confidence output wastes verification cycles and produces lower-quality accepted outputs. Early loop-back on confidence is always correct.',
      decision: 'LOOP BACK. Confidence < 70 is an automatic loop trigger. Do not skip to other steps. Loop count: increment by 1.'
    },
    {
      pattern_name: 'autonomy-before-escalation',
      pattern_type: 'autonomy',
      context: 'Agent encounters a blocker or unknown — tool missing, unclear instruction, or failed execution.',
      recommended_action: 'Before creating a blocker ticket: (1) search memory for prior solutions, (2) search ClawHub for skills, (3) web search for solutions, (4) try 2 alternative approaches. Only escalate after exhausting all options.',
      outcome_quality: 'high',
      reasoning: 'Agents that escalate immediately without trying alternatives create unnecessary human bottlenecks. The autonomy scoring protocol rewards independent problem-solving.',
      decision: 'TRY ALTERNATIVES. Order: memory_search → clawhub → web_search → alternative approach → then escalate with full documentation of what was tried.'
    },
    {
      pattern_name: 'route-accuracy-critical-to-claude',
      pattern_type: 'routing',
      context: 'Task involves legal review, financial calculations, compliance checking, or security assessment.',
      recommended_action: 'Route to Claude Haiku at minimum. Do not route accuracy-critical tasks to local LLM or Grok despite cost.',
      outcome_quality: 'high',
      reasoning: 'Accuracy-critical tasks carry real consequences for errors. Local models and mid-tier models have higher hallucination rates on specialized domains. The cost of an error exceeds the API cost.',
      decision: 'ROUTE TO CLAUDE HAIKU MINIMUM. Accuracy-critical tasks require reliability over cost optimization.'
    },
    {
      pattern_name: 'ticket-route-and-continue',
      pattern_type: 'routing',
      context: 'Agent receives a task that falls outside its defined scope (out-of-lane task).',
      recommended_action: 'Do not stop. (1) Open AGENT-REGISTRY.md, (2) identify correct agent, (3) create ticket for that agent, (4) route via Orchestrator, (5) update own ticket with routing note, (6) close own ticket, (7) continue in-scope work.',
      outcome_quality: 'high',
      reasoning: 'Stopping on out-of-scope tasks creates bottlenecks. The correct behavior is to route and continue — the ecosystem handles cross-agent coordination through the ticket system.',
      decision: 'ROUTE AND CONTINUE. Create ticket for correct agent. Do not pause own work queue.'
    },
    {
      pattern_name: 'shared-learning-write-on-completion',
      pattern_type: 'pattern_application',
      context: 'Agent completes a task that produced a reusable insight, pattern, or technique.',
      recommended_action: 'Write the learning to the appropriate shared-learnings directory (DTP/onxza/ for ONXZA-specific, global/ for universal). Include: what worked, what failed, when to apply.',
      outcome_quality: 'high',
      reasoning: 'Shared learnings compound. Every pattern written becomes available to all agents. This is how the ecosystem grows smarter over time without retraining.',
      decision: 'WRITE SHARED LEARNING. Scope: DTP/onxza/ for ONXZA-specific, global/ for universal patterns. Format: named pattern file with context, action, and outcome.'
    }
  ];

  // Also extract patterns from existing pattern files
  for (const file of patternFiles) {
    if (file.file === 'README.md') continue; // Skip READMEs
    // We'll extract the content as a pattern — the file itself IS the pattern
    const content = file.content;
    if (content.length < 100) continue; // Skip stubs
  }

  for (const pattern of seedPatterns) {
    const content = JSON.stringify(pattern);
    const record = {
      id: generateId('shared_learning', content),
      source: 'shared_learning',
      version: '1.0',
      created_at: new Date().toISOString(),
      input: {
        instruction: `Apply the correct ONXZA ecosystem pattern to this situation.`,
        context: pattern.context,
        task_type: 'pattern_application'
      },
      output: {
        reasoning: pattern.reasoning,
        decision: pattern.decision,
        confidence: 90
      },
      metadata: {
        source: 'shared_learning',
        fvp_result: 'pass',
        loop_count: 1,
        was_optimal: true,
        anonymized: false,
        anonymization_pass: null
      }
    };
    records.push(record);
  }

  // Extract from autonomy scoring protocol
  const autonomyPath = path.join(WORKSPACE_ROOT, 'shared-learnings/global/patterns/autonomy-scoring-protocol.md');
  const autonomyContent = readMarkdownFile(autonomyPath);
  if (autonomyContent) {
    const record = {
      id: generateId('shared_learning', autonomyContent.slice(0, 200)),
      source: 'shared_learning',
      version: '1.0',
      created_at: new Date().toISOString(),
      input: {
        instruction: 'Score this agent\'s autonomy behavior on a 0-10 scale and explain the score.',
        context: 'Agent task failed. Agent tried one web search, found no result, immediately created a blocker ticket without trying alternative approaches or searching for relevant skills.',
        task_type: 'verification'
      },
      output: {
        reasoning: 'Agent tried one approach (web search) before stopping. Did not search memory, ClawHub, or try alternative implementations. Did not use local LLM as fallback. Did not document specifically what was tried in the blocker. Score breakdown: ClawHub/web search: +2 (did search), Multiple attempts: 0 (only 1), Web search: +2, Local LLM fallback: 0, Documentation: 0. Total: 4/10.',
        decision: 'AUTONOMY SCORE: 4/10. Flag to PM. Agent stopped without exhausting options. Requires autonomy retraining note. Agent should have tried: (1) memory_search for prior solutions, (2) ClawHub for skills, (3) alternative approach, (4) documented what was tried.',
        confidence: 88
      },
      metadata: {
        source: 'shared_learning',
        fvp_result: 'pass',
        loop_count: 1,
        was_optimal: true,
        anonymized: false,
        anonymization_pass: null
      }
    };
    records.push(record);
  }

  console.log(`[collect] Shared Learnings: ${records.length} candidates collected`);
  return records;
}

/**
 * Main collection runner.
 */
function collect() {
  console.log('[collect] Starting ONXZA-LLM training data collection...');

  const routingRecords = collectRoutingDecisions();
  const fvpRecords = collectFvpOutcomes();
  const sharedLearningRecords = collectSharedLearnings();

  const allRecords = [...routingRecords, ...fvpRecords, ...sharedLearningRecords];

  console.log(`[collect] Total candidates: ${allRecords.length}`);
  console.log(`  routing: ${routingRecords.length}`);
  console.log(`  fvp: ${fvpRecords.length}`);
  console.log(`  shared_learning: ${sharedLearningRecords.length}`);

  // Write raw candidates to temp file for anonymizer
  const outputDir = path.join(__dirname, '../output');
  fs.mkdirSync(outputDir, { recursive: true });

  const rawPath = path.join(outputDir, 'raw-candidates.jsonl');
  const lines = allRecords.map(r => JSON.stringify(r)).join('\n');
  fs.writeFileSync(rawPath, lines + '\n', 'utf8');

  console.log(`[collect] Raw candidates written to: ${rawPath}`);
  return allRecords;
}

// Run if called directly
if (require.main === module) {
  collect();
}

module.exports = { collect, generateId };
