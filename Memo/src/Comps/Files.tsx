import type React from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMemoStore } from "./memo-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileTextIcon, ArrowLeft, Plus, Trash2, Edit2, MoreVertical, Save, X, Loader2 } from "lucide-react";
import CryptoJS from "crypto-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Line {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface FileMetadata {
  id: string;
  title: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    lines: number;
  };
}

interface FileWithLines {
  id: string;
  title: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
  lines: Line[];
}

interface Folder {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
  };
  files: FileMetadata[];
}

export function FilesView() {
  const { folderId } = useParams<{ folderId: string }>();
  const { selectedFolder, selectedFile, setSelectedFolder, setSelectedFile } = useMemoStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditFileOpen, setIsEditFileOpen] = useState(false);
  const [isDeleteFileOpen, setIsDeleteFileOpen] = useState(false);
  const [isDeleteLineOpen, setIsDeleteLineOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [editFileName, setEditFileName] = useState("");
  const [newLineContent, setNewLineContent] = useState("");
  const [selectedFileForAction, setSelectedFileForAction] = useState<FileMetadata | null>(null);
  const [selectedLineForAction, setSelectedLineForAction] = useState<Line | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editLineContent, setEditLineContent] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fixed secret key handling
  let secretKey: CryptoJS.lib.WordArray;
  try {
    const base64Key = import.meta.env.VITE_SECRET_KEY_BASE64;
    if (!base64Key) {
      throw new Error("VITE_SECRET_KEY_BASE64 is not defined");
    }
    secretKey = CryptoJS.enc.Base64.parse(base64Key);
    // Ensure we have a valid key (check for minimum length)
    if (secretKey.sigBytes < 16) {
      throw new Error(`Invalid key length: ${secretKey.sigBytes} bytes (minimum 16 bytes required)`);
    }
  } catch (error) {
    console.error("Error decoding VITE_SECRET_KEY_BASE64:", error);
    setKeyError("Invalid encryption key. Please check VITE_SECRET_KEY_BASE64 in your .env file.");
    secretKey = CryptoJS.lib.WordArray.create(); // Empty WordArray as fallback
  }

  function encryptString(plainText: string): string {
    if (keyError || secretKey.sigBytes === 0) {
      console.error("Cannot encrypt: Invalid or missing secret key");
      return "Encryption failed: Invalid key";
    }
    try {
      // Use CBC mode instead of GCM for better compatibility with CryptoJS
      const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes IV for CBC
      const encrypted = CryptoJS.AES.encrypt(plainText, secretKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      // Return IV + encrypted data as base64
      return `${CryptoJS.enc.Base64.stringify(iv)}:${encrypted.toString()}`;
    } catch (error) {
      console.error("Encryption failed:", error);
      return "Encryption failed";
    }
  }

  function decryptString(cipherText: string): string {
    if (keyError || secretKey.sigBytes === 0) {
      console.error("Cannot decrypt: Invalid or missing secret key");
      return "Decryption failed: Invalid key";
    }
    try {
      const parts = cipherText.split(":");
      if (parts.length !== 2) {
        throw new Error("Invalid ciphertext format");
      }
      
      const [ivB64, encryptedB64] = parts;
      const iv = CryptoJS.enc.Base64.parse(ivB64);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedB64, secretKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new Error("Decrypted content is empty - possibly wrong key or corrupted data");
      }
      return result;
    } catch (error) {
      console.error("Decryption failed:", error);
      return "Decryption failed";
    }
  }

  const fetchFiles = async () => {
    console.log("Fetching files metadata for folder:", folderId);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/file_folder/${folderId}`, {
        withCredentials: true,
      });
      console.log("Files metadata fetched:", response.data.data);
      return response.data.data as FileMetadata[];
    } catch (err) {
      console.error("Error fetching files:", err);
      throw err;
    }
  };

  const fetchFileWithLines = async (fileId: string) => {
    console.log("Fetching file with lines:", fileId);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/getLines/${fileId}`, {
        withCredentials: true,
      });
      console.log("File with lines fetched:", response.data.data);
      return response.data.data as FileWithLines;
    } catch (err) {
      console.error("Error fetching file lines:", err);
      throw err;
    }
  };

  const { data: filesData = [], isLoading: isFilesLoading, error: filesError } = useQuery({
    queryKey: ["files", folderId],
    queryFn: fetchFiles,
    enabled: !!folderId,
    retry: false,
  });

  const { 
    data: fileWithLinesData, 
    isLoading: isFileLoading, 
    error: fileError 
  } = useQuery({
    queryKey: ["file-lines", selectedFile?.id],
    queryFn: () => fetchFileWithLines(selectedFile!.id),
    enabled: !!selectedFile?.id,
    retry: false,
  });

  const createFileMutation = useMutation({
    mutationFn: async ({ folderId, fileName }: { folderId: string; fileName: string }) => {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/createFile`, {
        fileName: fileName,
        folderId: folderId
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      setFileName("");
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      console.error("Error creating file:", error);
      alert(error.response?.data?.message || "Failed to create file");
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async ({ folderId, fileId }: { folderId: string; fileId: string }) => {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/delete_file/${folderId}/${fileId}`, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      queryClient.invalidateQueries({ queryKey: ["file-lines"] });
      setIsDeleteFileOpen(false);
      setSelectedFileForAction(null);
      if (selectedFile && selectedFileForAction?.id === selectedFile.id) {
        setSelectedFile(null);
      }
    },
    onError: (error: any) => {
      console.error("Error deleting file:", error);
      alert(error.response?.data?.message || "Failed to delete file");
    }
  });

  const editFileMutation = useMutation({
    mutationFn: async ({ fileId, newName }: { fileId: string; newName: string }) => {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/edit_names`, {
        type: "file",
        editId: fileId,
        title: newName
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      queryClient.invalidateQueries({ queryKey: ["file-lines"] });
      setIsEditFileOpen(false);
      setSelectedFileForAction(null);
      setEditFileName("");
    },
    onError: (error: any) => {
      console.error("Error editing file:", error);
      alert(error.response?.data?.message || "Failed to edit file");
    }
  });

  const addLineMutation = useMutation({
    mutationFn: async ({ fileId, folderId, content }: { fileId: string; folderId: string; content: string }) => {
      const encryptedContent = encryptString(content);
      if (encryptedContent.startsWith("Encryption failed")) {
        throw new Error(encryptedContent);
      }
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/addLine`, {
        fileId: fileId,
        folderId: folderId,
        content: encryptedContent
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      queryClient.invalidateQueries({ queryKey: ["file-lines", selectedFile?.id] });
      setNewLineContent("");
    },
    onError: (error: any) => {
      console.error("Error adding line:", error);
      alert(error.response?.data?.message || error.message || "Failed to add line");
    }
  });

  const deleteLineMutation = useMutation({
    mutationFn: async ({ fileId, lineId }: { fileId: string; lineId: string }) => {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/delete_line/${fileId}/${lineId}`, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", folderId] });
      queryClient.invalidateQueries({ queryKey: ["file-lines", selectedFile?.id] });
      setIsDeleteLineOpen(false);
      setSelectedLineForAction(null);
    },
    onError: (error: any) => {
      console.error("Error deleting line:", error);
      alert(error.response?.data?.message || "Failed to delete line");
    }
  });

  const editLineMutation = useMutation({
    mutationFn: async ({ fileId, lineId, newLine }: { fileId: string; lineId: string; newLine: string }) => {
      const encryptedContent = encryptString(newLine);
      if (encryptedContent.startsWith("Encryption failed")) {
        throw new Error(encryptedContent);
      }
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/edit_line`, {
        fileId: fileId,
        lineId: lineId,
        newLine: encryptedContent
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-lines", selectedFile?.id] });
      setEditingLineId(null);
      setEditLineContent("");
    },
    onError: (error: any) => {
      console.error("Error editing line:", error);
      alert(error.response?.data?.message || error.message || "Failed to edit line");
    }
  });

  useEffect(() => {
    if (folderId && filesData) {
      console.log("Updating selectedFolder with files:", filesData);
      if (
        !selectedFolder ||
        selectedFolder.id !== folderId ||
        JSON.stringify(selectedFolder.files) !== JSON.stringify(filesData)
      ) {
        setSelectedFolder({
          id: folderId,
          name: selectedFolder?.name || "Folder",
          ownerId: selectedFolder?.ownerId || "",
          createdAt: selectedFolder?.createdAt || new Date().toISOString(),
          updatedAt: selectedFolder?.updatedAt || new Date().toISOString(),
          _count: { files: filesData.length },
          files: filesData,
        });
      }
    }
  }, [folderId, filesData, setSelectedFolder]);

  const handleFileClick = (file: FileMetadata) => {
    console.log("File clicked:", file.id, file.title);
    setSelectedFile({
      id: file.id,
      title: file.title,
      folderId: file.folderId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      lines: []
    });
  };

  const handleBackToFolders = () => {
    setSelectedFile(null);
    setSelectedFolder(null);
    navigate("/memo");
  };

  const handleBackToFiles = () => {
    setSelectedFile(null);
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileName.trim() && folderId) {
      createFileMutation.mutate({ folderId, fileName: fileName.trim() });
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyError) {
      alert(keyError);
      return;
    }
    if (newLineContent.trim() && selectedFile && folderId) {
      addLineMutation.mutate({
        fileId: selectedFile.id,
        folderId: folderId,
        content: newLineContent.trim()
      });
    }
  };

  const handleEditFile = (file: FileMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileForAction(file);
    setEditFileName(file.title);
    setIsEditFileOpen(true);
  };

  const handleDeleteFile = (file: FileMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFileForAction(file);
    setIsDeleteFileOpen(true);
  };

  const handleEditLine = (line: Line) => {
    if (keyError) {
      alert(keyError);
      return;
    }
    setEditingLineId(line.id);
    setEditLineContent(decryptString(line.content));
  };

  const handleDeleteLine = (line: Line) => {
    setSelectedLineForAction(line);
    setIsDeleteLineOpen(true);
  };

  const handleSaveEditLine = () => {
    if (keyError) {
      alert(keyError);
      return;
    }
    if (editingLineId && editLineContent.trim() && selectedFile) {
      editLineMutation.mutate({
        fileId: selectedFile.id,
        lineId: editingLineId,
        newLine: editLineContent.trim()
      });
    }
  };

  const handleCancelEditLine = () => {
    setEditingLineId(null);
    setEditLineContent("");
  };

  const handleEditFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFileName.trim() && selectedFileForAction) {
      editFileMutation.mutate({
        fileId: selectedFileForAction.id,
        newName: editFileName.trim()
      });
    }
  };

  const handleDeleteFileConfirm = () => {
    if (selectedFileForAction && folderId) {
      deleteFileMutation.mutate({
        folderId: folderId,
        fileId: selectedFileForAction.id
      });
    }
  };

  const handleDeleteLineConfirm = () => {
    if (selectedLineForAction && selectedFile) {
      deleteLineMutation.mutate({
        fileId: selectedFile.id,
        lineId: selectedLineForAction.id
      });
    }
  };

  if (keyError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{keyError}</p>
      </div>
    );
  }

  if (!folderId) return <div className="text-red-400">Invalid folder ID</div>;

  if (selectedFile) {
    if (isFileLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToFiles}
              className="border-gray-600 text-white hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-white">{selectedFile.title}</h2>
          </div>
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading file content...</p>
          </div>
        </div>
      );
    }

    if (fileError) {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToFiles}
              className="border-gray-600 text-white hover:text-white bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-bold text-white">{selectedFile.title}</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-red-400">
              {fileError.response?.data?.message || "Error loading file content. Please try again."}
            </p>
          </div>
        </div>
      );
    }

    const currentFileLines = fileWithLinesData?.lines || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToFiles}
            className="border-gray-600 text-white hover:text-white bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white">{selectedFile.title}</h2>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {currentFileLines.map((line, index) => (
                  <div key={line.id} className="p-3 bg-gray-800 rounded-lg border border-gray-600 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-sm text-gray-400 mr-3">{index + 1}.</span>
                        {editingLineId === line.id ? (
                          <div className="inline-flex items-center space-x-2 flex-1">
                            <Input
                              value={editLineContent}
                              onChange={(e) => setEditLineContent(e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEditLine();
                                } else if (e.key === 'Escape') {
                                  handleCancelEditLine();
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveEditLine}
                              disabled={editLineMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEditLine}
                              className="border-gray-600 text-white hover:bg-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-white">{decryptString(line.content)}</span>
                        )}
                      </div>
                      {editingLineId !== line.id && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLine(line)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLine(line)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {currentFileLines.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No content yet. Add your first line below!</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleAddLine} className="flex space-x-2">
                <Input
                  value={newLineContent}
                  onChange={(e) => setNewLineContent(e.target.value)}
                  placeholder="Add new line..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white"
                  disabled={!!keyError}
                />
                <Button
                  type="submit"
                  disabled={!newLineContent.trim() || addLineMutation.isPending || !!keyError}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addLineMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={isDeleteLineOpen} onOpenChange={setIsDeleteLineOpen}>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Line</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to delete this line? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLineConfirm}
                disabled={deleteLineMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLineMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToFolders}
            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white">{selectedFolder?.name || "Folder"}</h2>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!!keyError}>
              <Plus className="w-4 h-4 mr-2" />
              New File
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New File</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFile} className="space-y-4">
              <div>
                <Label htmlFor="fileName" className="text-white">
                  File Name
                </Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name..."
                  className="bg-gray-800 border-gray-600 text-white mt-2"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!fileName.trim() || createFileMutation.isPending} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createFileMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditFileOpen} onOpenChange={setIsEditFileOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editFileName" className="text-white">
                File Name
              </Label>
              <Input
                id="editFileName"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                placeholder="Enter file name..."
                className="bg-gray-800 border-gray-600 text-white"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditFileOpen(false)}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editFileName.trim() || editFileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editFileMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteFileOpen} onOpenChange={setIsDeleteFileOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedFileForAction?.title}"? This action cannot be undone and will delete all content in this file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFileConfirm}
              disabled={deleteFileMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFileMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isFilesLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading files...</p>
        </div>
      )}
      
      {filesError && (
        <div className="text-center py-4">
          <p className="text-red-400">
            {filesError.response?.data?.message || "Error fetching files. Please try again later."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filesData.map((file) => (
          <Card
            key={file.id}
            className="cursor-pointer hover:bg-gray-800 transition-colors bg-gray-900 border-gray-700 relative group"
            onClick={() => handleFileClick(file)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileTextIcon className="w-8 h-8 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">{file.title}</h3>
                    <p className="text-sm text-gray-400">
                      {file._count.lines} line{file._count.lines !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      onClick={(e) => handleEditFile(file, e)}
                      className="text-white hover:bg-gray-700 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteFile(file, e)}
                      className="text-red-400 hover:bg-gray-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filesData.length === 0 && !isFilesLoading && (
        <div className="text-center py-12">
          <FileTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No files in this folder. Create your first file!</p>
        </div>
      )}
    </div>
  );
}
