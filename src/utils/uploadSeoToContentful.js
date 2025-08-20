import { createClient } from "contentful-management";

export default async function uploadSeoToContentful(summary, blogName) {
  let parsed;
  try {
    parsed = JSON.parse(summary.seoSummary);
  } catch (err) {
    console.error("Failed to parse seoSummary JSON:", err, summary.seoSummary);
    return;
  }

  if (!parsed || typeof parsed !== "object") {
    console.error("Invalid parsed object:", parsed);
    return;
  }

  const client = createClient({
    accessToken: import.meta.env.VITE_CMA_ACCESS_TOKEN,
  });

  try {
    const space = await client.getSpace(import.meta.env.VITE_SPACE_ID);
    const environment = await space.getEnvironment(
      import.meta.env.VITE_ENVIRONMENT_ID
    );

    const entry = await environment.createEntry("harleyDavidsonBlogPostSeo", {
      fields: {
        blogTitle: { "en-US": "SEO: " + blogName },
        seoTitle: { "en-US": parsed.title || "" },
        seoSummary: { "en-US": parsed.description || "" },
        seoTags: {
          "en-US": Array.isArray(parsed.tags) ? parsed.tags.join(", ") : "",
        },
      },
    });

    console.log("Created SEO entry with ID:", entry?.sys?.id);
    return entry;
  } catch (error) {
    console.error("Error uploading SEO to Contentful:", error);
  }
}
