import { Video, Image, FileArchive } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/nav/sidebar";

// Static content data
const contents = [
  {
    id: 1,
    title: "Getting Started Guide",
    description: "A comprehensive guide for new users",
    type: "application",
    category: "learning",
    url: "/documents/getting-started.pdf"
  },
  {
    id: 2,
    title: "Product Demo",
    description: "Watch how to use key features",
    type: "video",
    category: "training",
    url: "/documents/product-demo.mp4"
  },
  {
    id: 3,
    title: "Feature Overview",
    description: "Visual guide to platform features",
    type: "image",
    category: "marketing",
    url: "/documents/features-overview.png"
  },
  {
    id: 4,
    title: "Integration Manual",
    description: "Technical documentation for API integration",
    type: "application",
    category: "learning",
    url: "/documents/integration-manual.pdf"
  },
  {
    id: 5,
    title: "Success Stories",
    description: "Case studies of successful implementations",
    type: "application",
    category: "marketing",
    url: "/documents/success-stories.pdf"
  }
];

export default function Contents() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Resource Library</h1>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <Card key={content.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-2">
                {content.type === 'video' && <Video className="h-5 w-5 mt-1" />}
                {content.type === 'image' && <Image className="h-5 w-5 mt-1" />}
                {content.type === 'application' && <FileArchive className="h-5 w-5 mt-1" />}
                <div>
                  <CardTitle className="text-lg">{content.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {content.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(content.url, '_blank')}
                >
                  View Document
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}