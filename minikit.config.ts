const ROOT_URL = process.env.VITE_PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export const minikitConfig = {
    accountAssociation: { // this will be added in step 5
      "header": process.env.VITE_HEADER,
      "payload": process.env.VITE_PAYLOAD,
      "signature": process.env.VITE_SIGNATURE
    },
    miniapp: {
      version: "1",
      name: "FavorEat", 
      subtitle: "", 
      description: "A dApp where food reviews earn rewards.",
      screenshotUrls: [`${ROOT_URL}/screenshot.png`],
      iconUrl: `${ROOT_URL}/logo.png`,
      splashImageUrl: `${ROOT_URL}/favoreat.gif`,
      splashBackgroundColor: "#FF4500",
      homeUrl: ROOT_URL,
      webhookUrl: `${ROOT_URL}/api/webhook`,
      primaryCategory: "social",
      tags: ["marketing", "ads", "quickstart", "waitlist"],
      heroImageUrl: `${ROOT_URL}/screenshot.png`, 
      tagline: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
    },
  } as const;