#!/bin/bash
# mpi-summary.sh — ONXZA MoE Routing Engine
# Summarize MPI data by model/domain. Shows router performance and learning status.
#
# Usage:
#   ./mpi-summary.sh
#   ./mpi-summary.sh --domain CODE
#   ./mpi-summary.sh --model claude-sonnet
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.
# Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_DIR="$(dirname "$SCRIPT_DIR")"
MPI_FILE="$ENGINE_DIR/mpi/mpi-data.jsonl"
LOG_FILE="$ENGINE_DIR/logger/routing-decisions.jsonl"
AGGREGATES="$ENGINE_DIR/mpi/mpi-aggregates.json"

FILTER_DOMAIN=""
FILTER_MODEL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) FILTER_DOMAIN="${2^^}"; shift 2 ;;
    --model) FILTER_MODEL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: mpi-summary.sh [--domain DOMAIN] [--model MODEL_ID]"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo ""
echo "════════════════════════════════════════"
echo "  ONXZA MPI Summary"
echo "  Model Performance Index"
echo "════════════════════════════════════════"
echo ""

# Total record count
if [[ -f "$MPI_FILE" ]]; then
  TOTAL=$(wc -l < "$MPI_FILE" | tr -d ' ')
  echo "  Total MPI Records: $TOTAL"
else
  echo "  No MPI data yet."
  exit 0
fi

ROUTING_TOTAL=$(wc -l < "$LOG_FILE" | tr -d ' ')
echo "  Routing Decisions Logged: $ROUTING_TOTAL"
echo ""

if ! command -v jq &>/dev/null; then
  echo "  Install jq for detailed stats: brew install jq"
  echo ""
  echo "  Raw MPI data: $MPI_FILE"
  exit 0
fi

echo "  Pass Rate by Model:"
echo "  ─────────────────────────────────────"
jq -r '.model_used.model_id + "|" + .performance.fvp_result' "$MPI_FILE" 2>/dev/null | \
  awk -F'|' '
    {
      model[$1]++
      if ($2 == "pass") pass[$1]++
    }
    END {
      for (m in model) {
        p = (m in pass) ? pass[m] : 0
        rate = (p / model[m]) * 100
        printf "  %-20s %d/%d (%.0f%%)\n", m, p, model[m], rate
      }
    }
  ' | sort -k3 -rn
echo ""

echo "  Pass Rate by Domain:"
echo "  ─────────────────────────────────────"
jq -r '.task.domain + "|" + .performance.fvp_result' "$MPI_FILE" 2>/dev/null | \
  awk -F'|' '
    {
      domain[$1]++
      if ($2 == "pass") pass[$1]++
    }
    END {
      for (d in domain) {
        p = (d in pass) ? pass[d] : 0
        rate = (p / domain[d]) * 100
        printf "  %-15s %d/%d (%.0f%%)\n", d, p, domain[d], rate
      }
    }
  ' | sort -k3 -rn
echo ""

echo "  Router Agreement Rate:"
TOTAL_R=$(jq -r '.router_data.suggestion_matched' "$MPI_FILE" 2>/dev/null | wc -l | tr -d ' ')
AGREE=$(jq -r 'select(.router_data.suggestion_matched == true) | .mpi_id' "$MPI_FILE" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$TOTAL_R" -gt 0 ]]; then
  RATE=$(echo "scale=0; $AGREE * 100 / $TOTAL_R" | bc)
  echo "  $AGREE/$TOTAL_R tasks matched router suggestion (${RATE}%)"
else
  echo "  No data"
fi
echo ""

echo "  Learning Status:"
echo "  ─────────────────────────────────────"
if [[ "$TOTAL" -lt 10 ]]; then
  echo "  Accumulating samples. Need $((10 - TOTAL)) more for first routing table update."
else
  echo "  Sufficient samples for routing table analysis. Run DTP_ONXZA_ModelIndex aggregator."
fi
echo ""

echo "  ⚡ Tier 3 Opportunities:"
T3=$(jq -r 'select(.router_data | has("tier3_opportunity") and .tier3_opportunity == true) | .source_log_id' "$MPI_FILE" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$T3" -gt 0 ]]; then
  echo "  $T3 task(s) flagged as scriptable (Tier 3 opportunity)"
else
  echo "  None flagged yet"
fi
echo ""

echo "════════════════════════════════════════"
echo "  Full data: $MPI_FILE"
echo "  Aggregates: $AGGREGATES"
echo "════════════════════════════════════════"
