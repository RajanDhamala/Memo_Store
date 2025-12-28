
"use client"

import { useEffect } from "react"
import { useMemoStore } from "./memo-store"
import FoldersView from "./Folders.tsx"
import FilesView from "./Files.tsx"
import { Loader2 } from "lucide-react"

export default function ParentPage() {
  const { data, isLoading, currentView, initializeData } = useMemoStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your memos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Memo System</h1>
          <p className="text-gray-400">Welcome back, {data.user.fullName}</p>
        </header>

        <main>
          {currentView === "folders" && <FoldersView />}
          {(currentView === "files" || currentView === "file") && <FilesView />}
        </main>
      </div>
    </div>
  )
}
