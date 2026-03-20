#!/bin/bash
# route-task.sh — ONXZA MoE Routing Engine
# Classify a task and suggest the optimal model.
#
# Usage:
#   ./route-task.sh --ticket-id TICKET-001 --domain CODE --tier 1
#   ./route-task.sh --ticket-id TICKET-001 --summary "Build a new API endpoint" [--priority high]
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.
# Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_DIR="$(dirname "$SCRIPT_DIR")"
ROUTING_TABLE="$ENGINE_DIR/router/routing-table.json"
LOG_FILE="$ENGINE_DIR/logger/routing-decisions.jsonl"

# Defaults
TICKET_ID=""
DOMAIN=""
TIER=""
SUMMARY=""
PRIORITY="normal"
AGENT_ID="${AGENT_ID:-unknown}"

usage() {
  echo "Usage: route-task.sh --ticket-id ID [--domain DOMAIN] [--tier 1|2|3] [--summary TEXT] [--priority high|normal]"
  echo ""
  echo "Options:"
  echo "  --ticket-id   Ticket ID (required)"
  echo "  --domain      Domain code: VISION|CODE|RESEARCH|CONTENT|ROUTING|OPS|SECURITY|FINANCE|SALES|MARKETING|LEGAL|QA|INFRA"
  echo "  --tier        Override tier: 1, 2, or 3"
  echo "  --summary     Task summary (used for auto-classification if domain/tier not given)"
  echo "  --priority    Task priority (high|normal)"
  echo "  --agent-id    Calling agent ID"
  exit 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ticket-id) TICKET_ID="$2"; shift 2 ;;
    --domain) DOMAIN=$(echo "$2" | tr '[:lower:]' '[:upper:]'); shift 2 ;;
    --tier) TIER="$2"; shift 2 ;;
    --summary) SUMMARY="$2"; shift 2 ;;
    --priority) PRIORITY="$2"; shift 2 ;;
    --agent-id) AGENT_ID="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[[ -z "$TICKET_ID" ]] && echo "ERROR: --ticket-id required" && usage

# Auto-classify domain from summary if not provided
if [[ -z "$DOMAIN" && -n "$SUMMARY" ]]; then
  SUMMARY_LOWER=$(echo "$SUMMARY" | tr '[:upper:]' '[:lower:]')
  if [[ "$SUMMARY_LOWER" =~ (security|audit|vulnerability|threat|hardening) ]]; then
    DOMAIN="SECURITY"
  elif [[ "$SUMMARY_LOWER" =~ (legal|compliance|contract|tos|sla) ]]; then
    DOMAIN="LEGAL"
  elif [[ "$SUMMARY_LOWER" =~ (code|build|implement|script|api|cli|debug|refactor|deploy|fix) ]]; then
    DOMAIN="CODE"
  elif [[ "$SUMMARY_LOWER" =~ (research|investigate|analyze|benchmark|compare|find) ]]; then
    DOMAIN="RESEARCH"
  elif [[ "$SUMMARY_LOWER" =~ (blog|content|article|write|copy|email sequence|draft) ]]; then
    DOMAIN="CONTENT"
  elif [[ "$SUMMARY_LOWER" =~ (route|classify|suggest model|routing) ]]; then
    DOMAIN="ROUTING"
  elif [[ "$SUMMARY_LOWER" =~ (outreach|crm|prospect|lead|pipeline|deal) ]]; then
    DOMAIN="SALES"
  elif [[ "$SUMMARY_LOWER" =~ (seo|campaign|brand|marketing|growth|affiliate) ]]; then
    DOMAIN="MARKETING"
  elif [[ "$SUMMARY_LOWER" =~ (audit|verify|check|review|qa) ]]; then
    DOMAIN="QA"
  elif [[ "$SUMMARY_LOWER" =~ (infra|server|dns|vercel|ci|cd|deploy) ]]; then
    DOMAIN="INFRA"
  elif [[ "$SUMMARY_LOWER" =~ (finance|revenue|cost|budget|mrr|expense) ]]; then
    DOMAIN="FINANCE"
  elif [[ "$SUMMARY_LOWER" =~ (vision|architecture|strategy|faails|onxza) ]]; then
    DOMAIN="VISION"
  else
    DOMAIN="OPS"
  fi
  echo "AUTO-CLASSIFIED domain: $DOMAIN"
fi

[[ -z "$DOMAIN" ]] && DOMAIN="OPS"

# Auto-classify tier if not provided
if [[ -z "$TIER" ]]; then
  case "$DOMAIN" in
    SECURITY|LEGAL) TIER=1 ;;
    VISION) TIER=1 ;;
    OPS)
      # OPS tasks are often Tier 3
      if [[ "$PRIORITY" == "critical" ]]; then TIER=2; else TIER=3; fi
      ;;
    CODE|RESEARCH)
      if [[ "$PRIORITY" == "high" || "$PRIORITY" == "critical" ]]; then TIER=1; else TIER=2; fi
      ;;
    *) TIER=2 ;;
  esac
  echo "AUTO-CLASSIFIED tier: $TIER"
fi

# Look up model suggestion from routing table
if command -v jq &>/dev/null; then
  case "$TIER" in
    3) SUGGESTED_MODEL=$(jq -r ".routes.tier3.domains[\"$DOMAIN\"] // .routes.tier3.default" "$ROUTING_TABLE") ;;
    2) SUGGESTED_MODEL=$(jq -r ".routes.tier2.domains[\"$DOMAIN\"] // .routes.tier2.default" "$ROUTING_TABLE") ;;
    1) SUGGESTED_MODEL=$(jq -r ".routes.tier1.domains[\"$DOMAIN\"] // .routes.tier1.default" "$ROUTING_TABLE") ;;
    *) SUGGESTED_MODEL="claude-sonnet" ;;
  esac
  MODEL_NAME=$(jq -r ".models[\"$SUGGESTED_MODEL\"].model // \"unknown\"" "$ROUTING_TABLE")
  MODEL_PROVIDER=$(jq -r ".models[\"$SUGGESTED_MODEL\"].provider // \"unknown\"" "$ROUTING_TABLE")
else
  # Fallback without jq
  case "$TIER" in
    3) SUGGESTED_MODEL="script"; MODEL_NAME="shell/python"; MODEL_PROVIDER="local" ;;
    2) SUGGESTED_MODEL="local-fast"; MODEL_NAME="marcusgear/qwen9b"; MODEL_PROVIDER="ollama" ;;
    1)
      case "$DOMAIN" in
        SECURITY|LEGAL) SUGGESTED_MODEL="claude-opus"; MODEL_NAME="claude-opus-4-6"; MODEL_PROVIDER="anthropic" ;;
        *) SUGGESTED_MODEL="claude-sonnet"; MODEL_NAME="claude-sonnet-4-6"; MODEL_PROVIDER="anthropic" ;;
      esac
      ;;
  esac
fi

# Tier 3 opportunity check (repeated task types would be tracked in MPI)
TIER3_OPPORTUNITY="false"
if [[ "$TIER" != "3" ]]; then
  # For now: flag OPS tasks as Tier 3 opportunities
  [[ "$DOMAIN" == "OPS" ]] && TIER3_OPPORTUNITY="true"
fi

# Build log entry
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_ID="RD-$(date +%Y%m%d)-$(( RANDOM % 900 + 100 ))"
CONFIDENCE=80
[[ "$DOMAIN" == "OPS" ]] && CONFIDENCE=90
[[ "$DOMAIN" == "SECURITY" || "$DOMAIN" == "LEGAL" ]] && CONFIDENCE=95

LOG_ENTRY=$(cat <<EOF
{"log_id":"$LOG_ID","ticket_id":"$TICKET_ID","logged_at":"$TIMESTAMP","classification":{"domain":"$DOMAIN","tier":$TIER,"tier_reason":"auto-classified","confidence":$CONFIDENCE},"router_suggestion":{"model_id":"$SUGGESTED_MODEL","model_name":"$MODEL_NAME","provider":"$MODEL_PROVIDER","reason":"Tier $TIER $DOMAIN domain routing","confidence":$CONFIDENCE,"mpi_override":false,"tier3_opportunity":$TIER3_OPPORTUNITY},"expert":{"agent_id":"$AGENT_ID","model_id":"pending","model_name":"pending","provider":"pending"},"agreement":{"match":null,"disagreement_reason":null},"outcome":{"status":"pending","fvp_result":null,"confidence_score":null,"loop_count":null,"time_to_complete_seconds":null,"estimated_cost_usd":null,"completed_at":null}}
EOF
)

# Append to log
echo "$LOG_ENTRY" >> "$LOG_FILE"

# Output routing suggestion
echo ""
echo "════════════════════════════════════════"
echo "  ONXZA MoE Routing Engine"
echo "════════════════════════════════════════"
echo "  Ticket:    $TICKET_ID"
echo "  Domain:    $DOMAIN"
echo "  Tier:      $TIER"
echo "  Model:     $SUGGESTED_MODEL ($MODEL_NAME)"
echo "  Provider:  $MODEL_PROVIDER"
echo "  Confidence: ${CONFIDENCE}%"
if [[ "$TIER3_OPPORTUNITY" == "true" ]]; then
  echo "  ⚡ TIER 3 OPPORTUNITY: This task may be scriptable"
fi
echo "  Log ID:    $LOG_ID"
echo "════════════════════════════════════════"
echo ""
echo "NOTE: This is advisory. The Expert uses its own configured model."
echo "      Log outcome with: ./log-outcome.sh --log-id $LOG_ID --model MODEL --fvp-result pass|fail"
