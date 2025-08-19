import { createClient } from "contentful-management";

export default async function uploadSeoToContentful(summary, blogName) {
  let parsed;

  try {
    const clean = summary.seoSummary
      .replace(/```json\n?/, "")
      .replace(/```$/, "");
    parsed = JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse summary JSON:", e, summary.seoSummary);
    return;
  }

  console.log(parsed.title);

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
        seoTitle: { "en-US": parsed.title },
        seoSummary: { "en-US": parsed.description },
        seoTags: {
          "en-US": parsed.tags.join(", "),
        },
      },
    });

    console.log("Created entry with ID:", entry.sys.id);
    return entry;
  } catch (error) {
    console.error("Error uploading SEO to Contentful:", error);
  }
}
