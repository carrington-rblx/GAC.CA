import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/services", "/travel-advice", "/apply-visa", "/passport-office", "/check-reference", "/publications", "/diplomatic-recognition", "/admin"];
  return routes.map((route) => ({
    url: route,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
