import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Ledger",
    short_name: "Ledger",
    description: "A private, personal expense tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f3",
    theme_color: "#f8f7f3",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" }
    ]
  };
}
