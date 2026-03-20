#!/bin/bash
# log-outcome.sh — ONXZA MoE Routing Engine
# Log task outcome (Phase 2) and write to MPI.
#
# Usage:
#   ./log-outcome.sh --log-id RD-20260318-001 --model claude-sonnet --fvp-result pass \
#     [--confidence 85] [--loops 1] [--seconds 120] [--cost 0.05]
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.
# Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$ENGINE_DIR/logger/routing-decisions.jsonl"
MPI_FILE="$ENGINE_DIR/mpi/mpi-data.jsonl"
ROUTING_TABLE="$ENGINE_DIR/router/routing-table.json"

# Defaults
LOG_ID=""
MODEL_ID=""
FVP_RESULT=""
CONFIDENCE=75
LOOPS=1
SECONDS_TAKEN=""
COST_USD=""
AGENT_ID="${AGENT_ID:-unknown}"

usage() {
  echo "Usage: log-outcome.sh --log-id RD-... --model MODEL_ID --fvp-result pass|fail [options]"
  echo ""
  echo "Required:"
  echo "  --log-id      Routing decision log ID from route-task.sh"
  echo "  --model       Model ID actually used (e.g. claude-sonnet, local-fast)"
  echo "  --fvp-result  FVP verification result: pass or fail"
  echo ""
  echo "Optional:"
  echo "  --confidence  Expert confidence score 0-100 (default: 75)"
  echo "  --loops       FVP loop count (default: 1)"
  echo "  --seconds     Time to complete in seconds"
  echo "  --cost        Estimated cost in USD"
  echo "  --agent-id    Expert agent ID"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --log-id) LOG_ID="$2"; shift 2 ;;
    --model) MODEL_ID="$2"; shift 2 ;;
    --fvp-result) FVP_RESULT="$2"; shift 2 ;;
    --confidence) CONFIDENCE="$2"; shift 2 ;;
    --loops) LOOPS="$2"; shift 2 ;;
    --seconds) SECONDS_TAKEN="$2"; shift 2 ;;
    --cost) COST_USD="$2"; shift 2 ;;
    --agent-id) AGENT_ID="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

[[ -z "$LOG_ID" ]] && echo "ERROR: --log-id required" && usage
[[ -z "$MODEL_ID" ]] && echo "ERROR: --model required" && usage
[[ -z "$FVP_RESULT" ]] && echo "ERROR: --fvp-result required" && usage
[[ "$FVP_RESULT" != "pass" && "$FVP_RESULT" != "fail" ]] && echo "ERROR: --fvp-result must be pass or fail" && usage

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FIRST_ATTEMPT="true"
[[ "$LOOPS" -gt 1 ]] && FIRST_ATTEMPT="false"

# Get model name from routing table if jq available
if command -v jq &>/dev/null && [[ -f "$ROUTING_TABLE" ]]; then
  MODEL_NAME=$(jq -r ".models[\"$MODEL_ID\"].model // \"$MODEL_ID\"" "$ROUTING_TABLE")
  MODEL_PROVIDER=$(jq -r ".models[\"$MODEL_ID\"].provider // \"unknown\"" "$ROUTING_TABLE")
else
  MODEL_NAME="$MODEL_ID"
  MODEL_PROVIDER="unknown"
fi

# Find the original log entry and extract router suggestion
ROUTER_SUGGESTED=""
DOMAIN="unknown"
TIER="0"
if command -v jq &>/dev/null && [[ -f "$LOG_FILE" ]]; then
  ORIGINAL=$(grep "\"log_id\":\"$LOG_ID\"" "$LOG_FILE" | tail -1)
  if [[ -n "$ORIGINAL" ]]; then
    ROUTER_SUGGESTED=$(echo "$ORIGINAL" | jq -r '.router_suggestion.model_id // "unknown"')
    DOMAIN=$(echo "$ORIGINAL" | jq -r '.classification.domain // "unknown"')
    TIER=$(echo "$ORIGINAL" | jq -r '.classification.tier // 0')
  fi
fi

SUGGESTION_MATCHED="false"
[[ "$ROUTER_SUGGESTED" == "$MODEL_ID" ]] && SUGGESTION_MATCHED="true"

SECONDS_JSON="null"
[[ -n "$SECONDS_TAKEN" ]] && SECONDS_JSON="$SECONDS_TAKEN"
COST_JSON="null"
[[ -n "$COST_USD" ]] && COST_JSON="$COST_USD"

# Write MPI record
MPI_ID="MPI-$(date +%Y%m%d)-$(( RANDOM % 900 + 100 ))"
MPI_ENTRY=$(cat <<EOF
{"mpi_id":"$MPI_ID","source_log_id":"$LOG_ID","source_ticket_id":"","recorded_at":"$TIMESTAMP","task":{"domain":"$DOMAIN","tier":$TIER,"summary_hash":"","word_count_estimate":null,"gap":false},"model_used":{"model_id":"$MODEL_ID","model_name":"$MODEL_NAME","provider":"$MODEL_PROVIDER","was_router_suggestion":$SUGGESTION_MATCHED},"performance":{"fvp_result":"$FVP_RESULT","first_attempt_pass":$FIRST_ATTEMPT,"loop_count":$LOOPS,"confidence_score":$CONFIDENCE,"time_to_complete_seconds":$SECONDS_JSON,"estimated_cost_usd":$COST_JSON},"router_data":{"suggested_model_id":"$ROUTER_SUGGESTED","suggestion_matched":$SUGGESTION_MATCHED,"suggestion_confidence":null}}
EOF
)

echo "$MPI_ENTRY" >> "$MPI_FILE"

echo ""
echo "════════════════════════════════════════"
echo "  MPI Outcome Logged"
echo "════════════════════════════════════════"
echo "  Log ID:     $LOG_ID"
echo "  MPI ID:     $MPI_ID"
echo "  Model:      $MODEL_ID ($MODEL_NAME)"
echo "  FVP:        $FVP_RESULT"
echo "  Loops:      $LOOPS"
echo "  Confidence: ${CONFIDENCE}%"
if [[ "$SUGGESTION_MATCHED" == "true" ]]; then
  echo "  Agreement:  ✓ Router suggestion matched"
else
  echo "  Agreement:  ✗ Expert used different model (router: $ROUTER_SUGGESTED)"
fi
echo "════════════════════════════════════════"
echo ""
echo "Data written to MPI. Run mpi-summary.sh to view aggregates."
