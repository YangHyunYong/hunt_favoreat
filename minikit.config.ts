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
      subtitle: "", 
      description: "",
      screenshotUrls: [""],
      iconUrl: `${ROOT_URL}/icons/logo.svg`,
      splashImageUrl: `${ROOT_URL}/icons/logo.png`,
      splashBackgroundColor: "#000000",
      homeUrl: ROOT_URL,
      webhookUrl: `${ROOT_URL}/api/webhook`,
      primaryCategory: "social",
      tags: ["marketing", "ads", "quickstart", "waitlist"],
      heroImageUrl: "", 
      tagline: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
    },
  } as const;