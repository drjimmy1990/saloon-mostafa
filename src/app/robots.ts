import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/account", "/checkout"],
      },
    ],
    sitemap: "https://gardenia-salon.com/sitemap.xml",
  };
}
