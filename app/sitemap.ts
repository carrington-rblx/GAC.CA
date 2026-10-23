import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/services", "/travel-advice", "/apply-visa", "/passport-office", "/passport-first", "/passport-renewal", "/passport-replacement", "/emergency-travel-document", "/check-reference", "/publications", "/government-leadership", "/diplomatic-careers", "/diplomatic-recognition", "/citizen-account", "/admin"];
  return routes.map((route) => ({ url: route, lastModified: new Date(), changeFrequency: "weekly", priority: route === "/" ? 1 : 0.6 }));
}
