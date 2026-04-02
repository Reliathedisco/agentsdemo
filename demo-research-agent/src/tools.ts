import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web for information on a topic. Returns a list of results with titles, URLs, and snippets.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    // Uses DuckDuckGo instant answer API — no API key needed for demos
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      const results: Array<{
        title: string;
        url: string;
        snippet: string;
      }> = [];

      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || "",
          snippet: data.Abstract,
        });
      }

      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 8)) {
          if (topic.Text) {
            results.push({
              title: topic.Text.slice(0, 80),
              url: topic.FirstURL || "",
              snippet: topic.Text,
            });
          }
        }
      }

      if (results.length === 0) {
        return {
          results: [
            {
              title: "No results found",
              url: "",
              snippet: `No instant results for "${query}". Try rephrasing or breaking the query into sub-topics.`,
            },
          ],
        };
      }

      return { results };
    } catch (error) {
      return {
        results: [
          {
            title: "Search error",
            url: "",
            snippet: `Search failed: ${error}. Try a different query.`,
          },
        ],
      };
    }
  },
});

export const fetchPage = tool({
  description:
    "Fetch and extract text content from a URL. Use this to read full articles or documentation pages.",
  parameters: z.object({
    url: z.string().url().describe("The URL to fetch content from"),
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ResearchAgent/1.0; +https://example.com)",
        },
        signal: AbortSignal.timeout(10000),
      });

      const html = await res.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);

      return { content: text, url, success: true };
    } catch (error) {
      return {
        content: `Failed to fetch: ${error}`,
        url,
        success: false,
      };
    }
  },
});

export const notepad = tool({
  description:
    "Save a research note or finding. Use this to accumulate key facts, quotes, and insights as you research.",
  parameters: z.object({
    category: z
      .enum(["key_finding", "statistic", "quote", "counterpoint", "source"])
      .describe("The type of note"),
    content: z.string().describe("The note content"),
    source: z.string().optional().describe("Where this information came from"),
    relevance: z
      .enum(["high", "medium", "low"])
      .describe("How relevant this is to the research topic"),
  }),
  execute: async ({ category, content, source, relevance }) => {
    return {
      saved: true,
      note: { category, content, source, relevance },
    };
  },
});

export const allTools = { webSearch, fetchPage, notepad };
