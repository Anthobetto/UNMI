// Mock data for fallback when database is not available
export const staticMockData = {
  contents: [
    {
      id: 1,
      title: "Getting Started Guide",
      description: "A comprehensive guide for new users",
      type: "application",
      url: "/documents/getting-started.pdf",
      category: "learning",
      active: true
    },
    {
      id: 2,
      title: "Product Demo",
      description: "Watch how to use key features",
      type: "video",
      url: "/documents/product-demo.mp4",
      category: "training",
      active: true
    },
    {
      id: 3,
      title: "Feature Overview",
      description: "Visual guide to platform features",
      type: "image",
      url: "/documents/features-overview.png",
      category: "marketing",
      active: true
    }
  ]
};
