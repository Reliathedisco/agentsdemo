import { classifyMessage, type Classification } from "./classifier.js";
import { draftResponse, type DraftResponse } from "./responder.js";

export interface TriageResult {
  id: string;
  timestamp: string;
  originalMessage: string;
  channel?: string;
  classification: Classification;
  draftResponse: DraftResponse;
  status: "auto_sent" | "pending_approval" | "escalated" | "logged";
}

export interface TriageLog {
  results: TriageResult[];
  stats: {
    total: number;
    autoSent: number;
    pendingApproval: number;
    escalated: number;
  };
}

const triageLog: TriageLog = {
  results: [],
  stats: { total: 0, autoSent: 0, pendingApproval: 0, escalated: 0 },
};

export function getTriageLog(): TriageLog {
  return triageLog;
}

export function getTriageResult(id: string): TriageResult | undefined {
  return triageLog.results.find((r) => r.id === id);
}

export async function triageMessage(
  message: string,
  channel?: string
): Promise<TriageResult> {
  const classification = await classifyMessage(message, channel);
  const draft = await draftResponse(message, classification);

  let status: TriageResult["status"];
  if (classification.suggestedAction === "escalate_to_human") {
    status = "escalated";
  } else if (draft.requiresApproval) {
    status = "pending_approval";
  } else if (classification.suggestedAction === "auto_respond") {
    status = "auto_sent";
  } else {
    status = "logged";
  }

  const result: TriageResult = {
    id: `triage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    originalMessage: message,
    channel,
    classification,
    draftResponse: draft,
    status,
  };

  triageLog.results.push(result);
  triageLog.stats.total++;
  if (status === "auto_sent") triageLog.stats.autoSent++;
  if (status === "pending_approval") triageLog.stats.pendingApproval++;
  if (status === "escalated") triageLog.stats.escalated++;

  return result;
}

export function approveResponse(id: string): TriageResult | null {
  const result = triageLog.results.find((r) => r.id === id);
  if (result && result.status === "pending_approval") {
    result.status = "auto_sent";
    triageLog.stats.pendingApproval--;
    triageLog.stats.autoSent++;
    return result;
  }
  return null;
}
