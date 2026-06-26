import { feed } from "../src/content/config/config.json";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

interface ContentItem {
  channel: string;
  title: string;
  desc: string;
  link: string;
  pubDate: string;
}

type FeedData = {
  data: Record<string, ContentItem[]>;
  lastUpdated: string;
};

const DATA_PATH = "src/content/config/data.json";
const FETCH_TIMEOUT_MS = 15000;
const FETCH_RETRIES = 2;
// Some feeds (Cloudflare-fronted, Substack, etc.) reject requests without a
// browser-like User-Agent, which is especially common from CI datacenter IPs.
const USER_AGENT =
  "Mozilla/5.0 (compatible; personal-site-feed-fetcher/1.0; +https://github.com/Battistanic28)";

// Read the previously committed feed so a source that fails to fetch on a given
// run keeps its last-known-good entries instead of silently disappearing.
const readExistingFeed = (): FeedData | null => {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as FeedData;
  } catch {
    return null;
  }
};

// Fetch a single feed with a timeout and retries. Throws on a non-OK response
// so that error pages (403/429/5xx) are never mistaken for an empty feed.
const fetchFeed = async (url: string): Promise<string> => {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
};

/*
Fetch title, descriotion and link for most recent article for each newsletter
If pubdate is greater than 3 days old, do not fetch/display
*/
export const getFeed = async (): Promise<FeedData> => {
  const sources = Object.keys(feed) as Array<keyof typeof feed>;
  const existing = readExistingFeed();

  const entries = await Promise.all(
    sources.map(async (source) => {
      const items = await Promise.all(
        feed[source].map(async (url): Promise<ContentItem | null> => {
          try {
            const data = await fetchFeed(url);
            const parser = new XMLParser();
            const xmlDoc = parser.parse(data);

            const channelData = xmlDoc?.rss?.channel;
            if (!channelData) return null;

            const item = Array.isArray(channelData.item)
              ? channelData.item[0]
              : channelData.item;

            if (!item) return null;

            return {
              channel: channelData.title ?? "",
              title: item.title ?? "",
              desc: item.description ?? "",
              link: item.link ?? "",
              pubDate: item.pubDate ?? "",
            };
          } catch (err) {
            console.warn(`Failed to fetch feed ${url}:`, err);
            return null;
          }
        }),
      );

      let validItems = items.filter(
        (item): item is ContentItem => item !== null,
      );

      // If every URL for this source failed, retain the last-known-good entries
      // so a transient outage never wipes the section from the deployed site.
      if (validItems.length === 0 && existing?.data[source]?.length) {
        console.warn(
          `All feeds failed for "${source}"; keeping previous data.`,
        );
        validItems = existing.data[source];
      }

      return [source, validItems] as const;
    }),
  );

  const data = Object.fromEntries(entries);
  const date = new Date();

  return { data: data, lastUpdated: date.toLocaleDateString() } as FeedData;
};

const writeFeed = async (data: FeedData) => {
  const jsonString = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(DATA_PATH, jsonString);
    console.log("Feed data updated successfully.");
  } catch (err) {
    console.error("Error writing file:", err);
  }
};

const data = await getFeed();
await writeFeed(data);
