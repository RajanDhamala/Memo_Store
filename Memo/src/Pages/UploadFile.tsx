

"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Download,
  FileText,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import toast from "react-hot-toast";

// Type definitions
interface MemoFile {
  id: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  isProtected: boolean;
}

interface UploadRequest {
  file: File;
  password?: string;
  newName?: string;
}

interface DownloadRequest {
  fileId: string;
  password?: string;
  fileName?: string;
}

interface UploadResponse {
  success: boolean;
  fileId?: string;
  message?: string;
}

interface FilesResponse {
  files: MemoFile[];
  totalPages: number;
  totalCount: number;
  page: number;
  count: number;
}

// API base URL
const API_BASE = `${import.meta.env.VITE_BASE_URL}`;

// API functions
const uploadFile = async ({ file, password, newName }: UploadRequest): Promise<UploadResponse> => {
  if (!file) throw new Error("No file selected");
  if (file.size > 10 * 1024 * 1024) throw new Error("File size exceeds 10MB limit");

  let fileToUpload = file;
  if (newName && newName !== file.name) {
    fileToUpload = new File([file], newName, { type: file.type });
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);
  if (password) formData.append("password", password);

  const response = await fetch(`${API_BASE}/memo/upload-txt`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Upload failed");
  return response.json();
};

const getFiles = async (page: number = 1): Promise<FilesResponse> => {
  const response = await fetch(`${API_BASE}/memo/get-files?page=${page}`);
  if (!response.ok) throw new Error("Failed to fetch files");
  const data = await response.json();
  if (!data.success || !Array.isArray(data.files)) throw new Error("Invalid response format");
  return {
    files: data.files,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
    page: data.page,
    count: data.count,
  };
};

const downloadFile = async ({ fileId, password }: Omit<DownloadRequest, "fileName">): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/memo/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(password ? { fileId, password } : { fileId }),
  });

  if (!response.ok) throw new Error("Download failed");
  return response.blob();
};

export default function FileUploadSystem() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [uploadPassword, setUploadPassword] = useState<string>("");
  const [uploadPasswordVisible, setUploadPasswordVisible] = useState<boolean>(false);
  const [downloadPasswords, setDownloadPasswords] = useState<Record<string, string>>({});
  const [downloadPasswordsVisible, setDownloadPasswordsVisible] = useState<Record<string, boolean>>({});
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeDownloads, setActiveDownloads] = useState<Set<string>>(new Set());

  // Queries
  const {
    data: filesResponse = { files: [], totalPages: 1, totalCount: 0, page: 1, count: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery<FilesResponse>({
    queryKey: ["files", currentPage],
    queryFn: () => getFiles(currentPage),
  });

  // Extract files and totalPages from response
  const { files, totalPages } = filesResponse;

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const file = droppedFiles[0];

    if (file) {
      handleFileSelection(file);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const allowedExtensions = [".pdf", ".docx", ".txt"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error("Only PDF, DOCX, and TXT files are allowed");
      return;
    }

    setSelectedFile(file);
    setNewFileName(file.name);
    setUploadModalOpen(true);
  };

  const handleDownloadClick = (file: MemoFile) => {
    if (file.isProtected) {
      setDownloadModalOpen(file.id);
    } else {
      downloadMutation.mutate({
        fileId: file.id,
        fileName: file.originalName,
      });
    }
  };

  const handlePasswordSubmit = (file: MemoFile) => {
    const password = downloadPasswords[file.id] || "";
    if (!password.trim()) {
      toast.error("Please enter a password for this protected file");
      return;
    }

    downloadMutation.mutate({
      fileId: file.id,
      password,
      fileName: file.originalName,
    });
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb < 0.01 ? "0.01 MB" : `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Mutations
  const uploadMutation = useMutation<UploadResponse, Error, UploadRequest>({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", currentPage] });
      setSelectedFile(null);
      setNewFileName("");
      setIsProtected(false);
      setUploadPassword("");
      setUploadModalOpen(false);
      toast.success("File uploaded successfully!");
    },
    onError: (err) => {
      toast.error(`Upload Failed: ${err.message}`);
    },
  });

  const downloadMutation = useMutation<Blob, Error, DownloadRequest>({
    mutationFn: ({ fileId, password }) => downloadFile({ fileId, password }),
    onMutate: ({ fileId }) => {
      setActiveDownloads((prev) => new Set(prev).add(fileId));
    },
    onSuccess: (blob, { fileName, fileId }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "download.txt";
      a.click();
      URL.revokeObjectURL(url);
      setDownloadModalOpen(null);
      setDownloadPasswords((prev) => ({ ...prev, [fileId]: "" }));
      toast.success("File downloaded successfully!");
    },
    onError: (err) => {
      toast.error(`Download Failed: ${err.message}`);
    },
    onSettled: (_, __, { fileId }) => {
      setActiveDownloads((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            MemoSaver File System
          </h1>
          <p className="text-slate-400 text-lg">
            Upload and manage your documents securely with military-grade encryption
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-2 border-blue-500/30 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Upload className="w-6 h-6" />
              STEP 1: UPLOAD FILE
            </CardTitle>
            <CardDescription className="text-slate-400">
              Upload PDF, Txt, Jsx, Tsx, Lua files up to 10MB. Drag and drop or click to browse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
                isDragOver
                  ? "border-purple-400 bg-purple-500/10 scale-105"
                  : "border-blue-500/50 hover:border-purple-400/70 hover:bg-slate-800/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-medium text-slate-100 mb-2">Drag & Drop a file here</p>
              <p className="text-slate-400 mb-4">or click to browse</p>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white bg-transparent transition-all duration-300"
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-100">Recent Files</h2>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">Error loading files: {error.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-slate-900/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : files.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <p className="text-lg text-slate-400">No files uploaded yet</p>
                <p className="text-sm text-slate-500">Upload your first file to get started</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <Card
                    key={file.id}
                    className="hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 bg-slate-900/50 border-slate-700 hover:border-blue-500/50"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <h3 className="font-medium text-slate-100 truncate" title={file.originalName}>
                              {file.originalName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {file.isProtected ? (
                              <Badge
                                variant="secondary"
                                className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Protected
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-green-500/20 text-green-300 border-green-500/30"
                              >
                                <Unlock className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => handleDownloadClick(file)}
                              className="text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Button
                        onClick={() => handleDownloadClick(file)}
                        disabled={activeDownloads.has(file.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300"
                      >
                        {activeDownloads.has(file.id) ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {activeDownloads.has(file.id) ? "Downloading..." : "Download"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center">
                  <Pagination>
                    <PaginationContent className="gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={`${
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer hover:bg-slate-800 text-slate-300"
                          }`}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className={`cursor-pointer transition-all duration-300 ${
                              currentPage === page
                                ? "bg-blue-600 text-white border-blue-600"
                                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={`${
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer hover:bg-slate-800 text-slate-300"
                          }`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        {/* Upload Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-100">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload File
              </DialogTitle>
              <DialogDescription className="text-slate-400">Configure your file upload settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedFile && (
                <>
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-slate-100">Selected File</span>
                    </div>
                    <p className="text-sm text-slate-300">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filename" className="text-slate-200">
                      File Name
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="filename"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="Enter new file name"
                        className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewFileName(selectedFile.name)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400">Original: {selectedFile.name}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="protect" checked={isProtected} onCheckedChange={setIsProtected} />
                    <Label htmlFor="protect" className="text-slate-200">
                      Password protect this file
                    </Label>
                  </div>

                  {isProtected && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-200">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={uploadPasswordVisible ? "text" : "password"}
                          value={uploadPassword}
                          onChange={(e) => setUploadPassword(e.target.value)}
                          placeholder="Enter password"
                          className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100"
                          onClick={() => setUploadPasswordVisible(!uploadPasswordVisible)}
                        >
                          {uploadPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        if (!selectedFile) return;
                        if (isProtected && !uploadPassword.trim()) {
                          toast.error("Please enter a password for protected files");
                          return;
                        }
                        uploadMutation.mutate({
                          file: selectedFile,
                          password: isProtected ? uploadPassword : undefined,
                          newName: newFileName || selectedFile.name,
                        });
                      }}
                      disabled={!selectedFile || uploadMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {uploadMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploadMutation.isPending ? "Uploading..." : "Upload File"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUploadModalOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Download Password Modal */}
        <Dialog open={!!downloadModalOpen} onOpenChange={() => setDownloadModalOpen(null)}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-100">
                <Lock className="w-5 h-5 text-amber-400" />
                Protected File
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This file is password protected. Enter the password to download.
              </DialogDescription>
            </DialogHeader>
            {downloadModalOpen && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="font-medium text-slate-100">
                    {files.find((f) => f.id === downloadModalOpen)?.originalName}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="download-password" className="text-slate-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="download-password"
                      type={downloadPasswordsVisible[downloadModalOpen] ? "text" : "password"}
                      value={downloadPasswords[downloadModalOpen] || ""}
                      onChange={(e) =>
                        setDownloadPasswords((prev) => ({
                          ...prev,
                          [downloadModalOpen]: e.target.value,
                        }))
                      }
                      placeholder="Enter password"
                      className="bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const file = files.find((f) => f.id === downloadModalOpen);
                          if (file) handlePasswordSubmit(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-100"
                      onClick={() =>
                        setDownloadPasswordsVisible((prev) => ({
                          ...prev,
                          [downloadModalOpen]: !prev[downloadModalOpen],
                        }))
                      }
                    >
                      {downloadPasswordsVisible[downloadModalOpen] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      const file = files.find((f) => f.id === downloadModalOpen);
                      if (file) handlePasswordSubmit(file);
                    }}
                    disabled={!downloadPasswords[downloadModalOpen]?.trim() || activeDownloads.has(downloadModalOpen)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {activeDownloads.has(downloadModalOpen) ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {activeDownloads.has(downloadModalOpen) ? "Downloading..." : "Download"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDownloadModalOpen(null)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
