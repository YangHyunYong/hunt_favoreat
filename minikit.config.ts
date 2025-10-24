const ROOT_URL = process.env.VITE_PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export const minikitConfig = {
    accountAssociation: { // this will be added in step 5
      "header": "",
      "payload": "",
      "signature": ""
    },
    miniapp: {
      version: "1",
      name: "FavorEat", 
      subtitle: "FavorEat", 
      description: "FavorEat",
      screenshotUrls: [`${ROOT_URL}/icons/logo.png`],
      iconUrl: `${ROOT_URL}/icons/logo.png`,
      splashImageUrl: `${ROOT_URL}/icons/logo.png`,
      splashBackgroundColor: "#000000",
      homeUrl: ROOT_URL,
      webhookUrl: `${ROOT_URL}/api/webhook`,
      primaryCategory: "social",
      tags: ["marketing", "ads", "quickstart", "waitlist"],
      heroImageUrl: `${ROOT_URL}/icons/logo.png`, 
      tagline: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: `${ROOT_URL}/icons/logo.png`,
    },
  } as const;