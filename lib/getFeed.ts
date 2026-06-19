import { feed } from "../src/content/config/config.json";
import { XMLParser } from "fast-xml-parser";

/*
Fetch title, descriotion and link for most recent article for each newsletter
If pubdate is greater than 3 days old, do not fetch/display
*/
export const getFeed = async () => {
  const urls = feed.substack;

  const feedData = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url);
      const data = await res.text();

      const parser = new XMLParser();
      const xmlDoc = parser.parse(data);

      const title = xmlDoc.rss.channel.item[0].title;
      const desc = xmlDoc.rss.channel.item[0].description;
      const link = xmlDoc.rss.channel.item[0].link;
      const pubDate = xmlDoc.rss.channel.item[0].pubDate;

      return { title, desc, link, pubDate };
    }),
  );

  return feedData;
};
