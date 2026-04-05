"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadInvoicePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadSuccess(false);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const data = await response.json();
      setUploadSuccess(true);
      toast.success("Invoice uploaded! Processing...");

      setTimeout(() => {
        router.push(`/invoices/${data.invoice.id}`);
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
          &larr; Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Invoice</h1>
        <p className="text-muted-foreground">
          Scan with your camera or upload a PDF/image of your maintenance invoice
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Invoice Document</CardTitle>
          <CardDescription>Supported formats: JPG, PNG, PDF (Max 10MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="h-32 flex flex-col gap-2"
              >
                <Camera className="h-10 w-10 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Take Photo</div>
                  <div className="text-xs text-muted-foreground">Use your device camera</div>
                </div>
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="h-32 flex flex-col gap-2"
              >
                <Upload className="h-10 w-10 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Upload File</div>
                  <div className="text-xs text-muted-foreground">Browse files on your device</div>
                </div>
              </Button>
            </div>
          )}

          {selectedFile && (
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">{selectedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </AlertDescription>
              </Alert>

              {preview && (
                <div className="border rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Invoice preview"
                    className="w-full h-auto max-h-96 object-contain bg-muted"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || uploadSuccess}
                  className="flex-1"
                  size="lg"
                >
                  {uploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {uploadSuccess && <CheckCircle2 className="mr-2 h-5 w-5" />}
                  {uploading ? "Uploading..." : uploadSuccess ? "Uploaded!" : "Upload & Process"}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setUploadSuccess(false);
                  }}
                  variant="outline"
                  disabled={uploading}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">&bull;</span>
              <span>Ensure the entire invoice is visible and in focus</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&bull;</span>
              <span>Use good lighting to avoid shadows on the document</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&bull;</span>
              <span>Keep the invoice flat and avoid wrinkles or folds</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">&bull;</span>
              <span>Make sure all text is readable, especially amounts and dates</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
