import { Video, Image, FileArchive, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/nav/sidebar";
import { Header } from "@/components/nav/header";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Static content data (Note:  The original contents array is fully retained here)
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
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('category', 'uploads');

    try {
      const response = await fetch('/api/contents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Optionally refresh the content list here
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-white">
        <Header pageName="Resource Library" />
        <main className="px-8 pb-8">
          <div className="flex items-center mb-6">
            <div className="w-full">
              <div className="flex items-center">
                <div className="text-sm text-muted-foreground mb-2">Accede a todos los recursos y documentos del sistema</div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,application/pdf"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Content Grid */}
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
        </main>
      </div>
    </div>
  );
}