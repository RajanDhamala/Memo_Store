import type React from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMemoStore } from "./memo-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AxiosError } from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderIcon, Plus, Trash2, Edit2, MoreVertical, Upload } from "lucide-react";
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
}

interface File {
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
  files: File[];
}

export default function FoldersView() {
  const { setSelectedFolder } = useMemoStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editFolderName, setEditFolderName] = useState("");
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<Folder | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch folder list
const fetchFolderList = async (): Promise<Folder[]> => {
  const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/folders`, {
    withCredentials: true,
  });

  return response.data.data.map((folder: Folder) => ({ ...folder, files: [] }));
};

const { data: folderData = [], isLoading, error } = useQuery<Folder[], AxiosError>({
  queryKey: ["folders", "list"],
  queryFn: fetchFolderList,
  retry: false,
});
  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/createFolder`, {
        folderName: folderName
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "list"] });
      setFolderName("");
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      console.error("Error creating folder:", error);
      alert(error.response?.data?.message || "Failed to create folder");
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/memo/delete_folder/${folderId}`, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "list"] });
      setIsDeleteOpen(false);
      setSelectedFolderForAction(null);
    },
    onError: (error: any) => {
      console.error("Error deleting folder:", error);
      alert(error.response?.data?.message || "Failed to delete folder");
    }
  });

  // Edit folder mutation
  const editFolderMutation = useMutation({
    mutationFn: async ({ folderId, newName }: { folderId: string; newName: string }) => {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/memo/edit_names`, {
        type: "folder",
        editId: folderId,
        title: newName
      }, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders", "list"] });
      setIsEditOpen(false);
      setSelectedFolderForAction(null);
      setEditFolderName("");
    },
    onError: (error: any) => {
      console.error("Error editing folder:", error);
      alert(error.response?.data?.message || "Failed to edit folder");
    }
  });

  const handleFolderClick = (folder: Folder) => {
    setSelectedFolder({ ...folder, files: [] });
    navigate(`/memo/${folder.id}`);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      createFolderMutation.mutate(folderName.trim());
    }
  };

  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolderForAction(folder);
    setEditFolderName(folder.name);
    setIsEditOpen(true);
  };

  const handleDeleteFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolderForAction(folder);
    setIsDeleteOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFolderName.trim() && selectedFolderForAction) {
      editFolderMutation.mutate({
        folderId: selectedFolderForAction.id,
        newName: editFolderName.trim()
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedFolderForAction) {
      deleteFolderMutation.mutate(selectedFolderForAction.id);
    }
  };

  const handleUploadClick = () => {
    navigate('/upload');
  };

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Folders</h2>
        <div className="flex items-center space-x-3">
          {/* Upload Files Button */}
          <Button
            onClick={handleUploadClick}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          
          {/* Create New Folder Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Folder</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <Label htmlFor="folderName" className="text-white">
                    Folder Name
                  </Label>
                  <Input
                    id="folderName"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    className="mt-2 bg-gray-800 border-gray-600 focus:outline-none text-white"
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
                    disabled={!folderName.trim() || createFolderMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {createFolderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editFolderName" className="text-white">
                Folder Name
              </Label>
              <Input
                id="editFolderName"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="bg-gray-800 border-gray-600 text-white"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editFolderName.trim() || editFolderMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editFolderMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Folder</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedFolderForAction?.name}"? This action cannot be undone and will delete all files in this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteFolderMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400">
            {(error as any)?.response?.data?.message || "Error fetching folders. Please try again later."}
          </p>
        </div>
      ) : folderData.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No folders yet. Create your first folder to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folderData.map((folder: Folder) => (
            <Card
              key={folder.id}
              className="cursor-pointer hover:bg-gray-800 transition-colors bg-gray-900 border-gray-700 relative group"
              onClick={() => handleFolderClick(folder)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-white">{folder.name}</h3>
                      <p className="text-sm text-gray-400">
                        {folder._count.files} file{folder._count.files !== 1 ? "s" : ""}
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
                        onClick={(e) => handleEditFolder(folder, e)}
                        className="text-white hover:bg-gray-700 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteFolder(folder, e)}
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
      )}
    </div>
  );
}
