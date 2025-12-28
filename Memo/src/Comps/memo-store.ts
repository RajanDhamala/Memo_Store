
import { create } from "zustand"
import axios from "axios"

export interface Line {
  id: string
  content: string
}

export interface File {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  lines: Line[]
}

export interface Folder {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  files: File[]
}

export interface User {
  id: string
  fullName: string
  email: string
  folders: Folder[]
}

export interface MemoData {
  user: User
}

const mockData: MemoData = {
  user: {
    id: "uuid-1",
    fullName: "Alice",
    email: "alice@example.com",
    folders: [
      {
        id: "folder-1",
        name: "Celebrities",
        createdAt: "2025-09-21T10:00:00Z",
        updatedAt: "2025-09-21T10:00:00Z",
        files: [
          {
            id: "file-1",
            title: "Hollywood Actors",
            createdAt: "2025-09-21T10:01:00Z",
            updatedAt: "2025-09-21T10:01:00Z",
            lines: [
              { id: "line-1", content: "Tom Cruise" },
              { id: "line-2", content: "Scarlett Johansson" },
              { id: "line-3", content: "Leonardo DiCaprio" },
            ],
          },
          {
            id: "file-2",
            title: "Bollywood Actors",
            createdAt: "2025-09-21T10:02:00Z",
            updatedAt: "2025-09-21T10:02:00Z",
            lines: [
              { id: "line-4", content: "Shah Rukh Khan" },
              { id: "line-5", content: "Deepika Padukone" },
            ],
          },
        ],
      },
      {
        id: "folder-2",
        name: "Favorite Singers",
        createdAt: "2025-09-21T11:00:00Z",
        updatedAt: "2025-09-21T11:00:00Z",
        files: [],
      },
    ],
  },
}

interface MemoStore {
  data: MemoData
  isLoading: boolean
  currentView: "folders" | "files" | "file"
  selectedFolder: Folder | null
  selectedFile: File | null

  // Actions
  setCurrentView: (view: "folders" | "files" | "file") => void
  setSelectedFolder: (folder: Folder | null) => void
  setSelectedFile: (file: File | null) => void
  createFolder: (name: string) => void
  createFile: (folderId: string, title: string) => void
  addLine: (fileId: string, folderId:string,content: string) => void
  initializeData: () => void
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  data: mockData,
  isLoading: false,
  currentView: "folders",
  selectedFolder: null,
  selectedFile: null,

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedFolder: (folder) => set({ selectedFolder: folder }),

  setSelectedFile: (file) => set({ selectedFile: file }),

  createFolder: async(name) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: [],
    }
    const folderCreate=await axios.post("http://localhost:8000/memo/createFolder",{
       folderName:name 
    },{
      withCredentials:true
    })

    console.log(folderCreate.data)

    set((state) => ({
      data: {
        ...state.data,
        user: {
          ...state.data.user,
          folders: [...state.data.user.folders, newFolder],
        },
      },
    }))
  },

  createFile: async(folderId, title) => {
    alert("file being created")
    const newFile: File = {
      id: `file-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: [],
    }
    const request=await axios.post(`http://localhost:8000/memo/createFile`,{
       fileName:title,
       folderId:folderId
 
    },{
      withCredentials:true
    })
    console.log("file data",request.data)

    set((state) => ({
      data: {
        ...state.data,
        user: {
          ...state.data.user,
          folders: state.data.user.folders.map((folder) =>
            folder.id === folderId ? { ...folder, files: [...folder.files, newFile] } : folder,
          ),
        },
      },
    }))
  },

  addLine: async(fileId,folderId ,content) => {
    const newLine: Line = {
      id: `line-${Date.now()}`,
      content,
    }
    await axios.post(`http://localhost:8000/memo/addLine`,{
        fileId:fileId,
    folderId:folderId,
    content:content
    },{
      withCredentials:true
    })
    set((state) => ({
      data: {
        ...state.data,
        user: {
          ...state.data.user,
          folders: state.data.user.folders.map((folder) => ({
            ...folder,
            files: folder.files.map((file) =>
              file.id === fileId ? { ...file, lines: [...file.lines, newLine] } : file,
            ),
          })),
        },
      },
    }))

    // Update selected file if it's the one being modified
    const { selectedFile } = get()
    if (selectedFile && selectedFile.id === fileId) {
      const updatedFile = get()
        .data.user.folders.flatMap((f) => f.files)
        .find((f) => f.id === fileId)
      if (updatedFile) {
        set({ selectedFile: updatedFile })
      }
    }
  },

  initializeData: () => {
    set({ isLoading: true })
    // Simulate loading
    setTimeout(() => {
      set({ isLoading: false })
    }, 500)
  },
}))
