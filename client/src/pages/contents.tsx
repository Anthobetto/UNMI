import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/nav/sidebar";
import { Content } from "@shared/schema";
import { Plus, Video, Image, FileArchive } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Contents() {
  const queryClient = useQueryClient();
  
  const { data: contents } = useQuery<Content[]>({
    queryKey: ["/api/contents"],
  });

  const uploadContent = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/contents", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload content");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents"] });
    },
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Contents</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                uploadContent.mutate(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="learning">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" name="file" type="file" accept=".pdf,image/*,video/*" required />
                </div>
                <Button type="submit" className="w-full" disabled={uploadContent.isPending}>
                  Upload
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {contents?.map((content) => (
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
                  View Content
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
