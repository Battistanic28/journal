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
  lastUpdated: Date;
};

/*
Fetch title, descriotion and link for most recent article for each newsletter
*/
export const getFeed = async (): Promise<FeedData> => {
  const sources = Object.keys(feed) as Array<keyof typeof feed>;

  const entries = await Promise.all(
    sources.map(async (source) => {
      const items = await Promise.all(
        feed[source].map(async (url) => {
          const res = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; MyAstroSite/1.0; +https://mysite.com)",
              Accept:
                "application/rss+xml, application/atom+xml, application/xml, text/xml",
            },
            signal: AbortSignal.timeout(15_000),
          });

          const data = await res.text();
          const parser = new XMLParser();
          const xmlDoc = parser.parse(data);

          const channelData = xmlDoc?.rss?.channel;
          if (!channelData) return null;

          const item = Array.isArray(channelData.item)
            ? channelData.item[0]
            : channelData.item;

          if (!item) return null;

          const contentItem: ContentItem = {
            channel: channelData.title ?? "",
            title: item.title ?? "",
            desc: item.description ?? "",
            link: item.link ?? "",
            pubDate: item.pubDate ?? "",
          };

          return contentItem;
        }),
      );

      const validItems = items.filter(
        (item): item is ContentItem => item !== null,
      );

      return [source, validItems] as const;
    }),
  );

  const data = Object.fromEntries(entries);
  const date = new Date();

  return { data: data, lastUpdated: date } as FeedData;
};
