import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fino - Controle financeiro",
    short_name: "Fino",
    description: "Seu dinheiro, com mais clareza.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f3ee",
    theme_color: "#15231d",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
