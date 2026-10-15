import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Ledger",
    short_name: "Ledger",
    description: "A private, personal expense tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#faf6ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" }
    ]
  };
}
