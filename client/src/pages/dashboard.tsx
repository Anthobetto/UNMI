import { motion } from "framer-motion";
import { IconUpload, IconCheck, IconFile } from "@tabler/icons-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsConverting(true);
    // Handle file conversion logic here
    setTimeout(() => setIsConverting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <motion.h1 
          className="text-4xl font-bold text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          File Converter
        </motion.h1>

        <Card>
          <CardContent>
            <motion.div
              className={`h-64 border-2 border-dashed rounded-lg flex items-center justify-center ${
                isDragging ? "border-primary" : "border-muted-foreground"
              }`}
              animate={{
                scale: isDragging ? 1.02 : 1,
                borderColor: isDragging ? "var(--primary)" : "var(--muted-foreground)"
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-center space-y-4">
                {isConverting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <IconFile className="w-12 h-12 mx-auto text-primary" />
                  </motion.div>
                ) : (
                  <>
                    <IconUpload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drag and drop your files here
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <IconFile className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-semibold">Supported Files</h3>
              <p className="text-sm text-muted-foreground">
                PDF, Word, PowerPoint, Excel
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <IconCheck className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-semibold">Instant Convert</h3>
              <p className="text-sm text-muted-foreground">
                Quick markdown conversion
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}