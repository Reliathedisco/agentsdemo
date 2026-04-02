import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { allTools } from "./tools.js";

const RESEARCH_SYSTEM_PROMPT = `You are an expert research agent. Your job is to thoroughly research a topic and produce a comprehensive, well-sourced report.

Your workflow:
1. Break the research topic into key sub-questions
2. Search for information on each sub-question using webSearch
3. Fetch full articles when you find promising sources using fetchPage
4. Save important findings using the notepad tool with appropriate categories
5. After gathering enough information, synthesize everything into a structured report

Guidelines:
- Search for multiple perspectives — look for supporting AND opposing viewpoints
- Prioritize recent, authoritative sources
- Save at least 5-8 notepad entries before writing your final report
- Be skeptical of claims without evidence
- Cite your sources in the final report

Your final response should be a well-structured research report in markdown format with:
- Executive Summary (2-3 sentences)
- Key Findings (numbered list)
- Detailed Analysis (organized by theme)
- Sources (list of URLs/references)`;

export async function runResearchAgent(topic: string): Promise<{
  report: string;
  toolCalls: number;
  sources: string[];
}> {
  console.log(`\n🔬 Researching: "${topic}"\n`);

  const { text, steps } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: RESEARCH_SYSTEM_PROMPT,
    prompt: `Research the following topic thoroughly and produce a detailed report:\n\n${topic}`,
    tools: allTools,
    maxSteps: 15,
    onStepFinish: ({ toolCalls, text }) => {
      if (toolCalls?.length) {
        for (const tc of toolCalls) {
          const args =
            "query" in tc.args
              ? tc.args.query
              : "url" in tc.args
                ? tc.args.url
                : "category" in tc.args
                  ? `[${tc.args.category}]`
                  : "";
          console.log(`  🔧 ${tc.toolName}: ${args}`);
        }
      }
      if (text) {
        console.log(`\n  📝 Agent is writing the report...`);
      }
    },
  });

  const totalToolCalls = steps.reduce(
    (sum, step) => sum + (step.toolCalls?.length || 0),
    0
  );

  const sources: string[] = [];
  for (const step of steps) {
    for (const tc of step.toolCalls || []) {
      if (tc.toolName === "fetchPage" && "url" in tc.args) {
        sources.push(tc.args.url as string);
      }
    }
  }

  return { report: text, toolCalls: totalToolCalls, sources };
}

async function main() {
  const topic = process.argv.slice(2).join(" ");

  if (!topic) {
    console.log('Usage: npm run research -- "your research topic here"');
    console.log('Example: npm run research -- "Impact of AI agents on SaaS workflows in 2026"');
    process.exit(1);
  }

  const { report, toolCalls, sources } = await runResearchAgent(topic);

  console.log("\n" + "=".repeat(60));
  console.log("RESEARCH REPORT");
  console.log("=".repeat(60) + "\n");
  console.log(report);
  console.log("\n" + "-".repeat(60));
  console.log(`📊 Stats: ${toolCalls} tool calls, ${sources.length} pages fetched`);
}

main().catch(console.error);
