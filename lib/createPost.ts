import fs from "fs";
import path from "path";

export const createNewPost = () => {
  const slug = process.argv[2];
  const date = new Date()

  if (!slug) {
    console.error("Usage: bun run lib/createPost.ts <slug>");
    process.exit(1);
  }

  // Target lives under src/content/ramblings/; reference lib via import.meta.dirname
  // (ESM-native equivalent of __dirname) so the path works regardless of where
  // the script is invoked from.
  const filePath = path.join(
    process.cwd(),
    "src",
    "content",
    "ramblings",
    `${slug}.mdx`,
  );

  const postBody = `
---
title: title
published: ${date.toLocaleDateString()}
slug: ${slug}
---

[[◄] index](/)

  <i>
    Published: {frontmatter.published}
  </i>

# {frontmatter.title}
`;

  try {
    fs.writeFileSync(filePath, postBody, "utf8");
    console.log(`File written successfully: ${filePath}`);
  } catch (error) {
    console.error("Failed to write file:", error);
    process.exit(1);
  }
};

// Only run when invoked directly (not when imported elsewhere).
if (import.meta.main) {
  createNewPost();
}
