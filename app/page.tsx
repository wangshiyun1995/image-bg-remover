"use client";

import { useState, useCallback } from "react";
import { Upload, ImageIcon, Download, X, Loader2 } from "lucide-react";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const removeBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalImage }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove background");
      }

      setProcessedImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "removed-background.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BG Remover
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              Remove Image Background
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Upload an image and get a transparent background in seconds
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Upload Area */}
          {!originalImage && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer
                ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                    : "border-slate-300 bg-white/50 dark:border-slate-600 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    Drop your image here, or click to browse
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Supports JPG, PNG, WebP (max 5MB)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview & Actions */}
          {originalImage && (
            <div className="space-y-6">
              {/* Image Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Original
                    </span>
                    <button
                      onClick={handleReset}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0iI2YxZjFmMSIvPjxwYXRoIGQ9Ik0xMCAxMGgyMHYyMEgxMHoiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')] rounded-lg overflow-hidden">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Processed */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Result
                    </span>
                    {processedImage && (
                      <button
                        onClick={handleDownload}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <Download className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                  </div>
                  <div className="relative aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0iI2YxZjFmMSIvPjxwYXRoIGQ9Ik0xMCAxMGgyMHYyMEgxMHoiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')] rounded-lg overflow-hidden flex items-center justify-center">
                    {processedImage ? (
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        {isProcessing ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-sm text-slate-500">
                              Removing background...
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Click button below to process
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {!processedImage && !isProcessing && (
                  <button
                    onClick={removeBackground}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                  >
                    Remove Background
                  </button>
                )}
                {processedImage && (
                  <>
                    <button
                      onClick={handleDownload}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Result
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-8 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                    >
                      Upload New Image
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 py-4">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-500">
          Powered by remove.bg API • Built with Next.js
        </div>
      </footer>
    </div>
  );
}
