
import { Link } from "react-router-dom"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UploadIconButton() {
  return (
    <Link to="/upload">
      <Button 
        variant="outline" 
        className="flex items-center gap-2 rounded-xl p-2 hover:bg-gray-800"
      >
        <Upload className="h-5 w-5" />
        <span>Upload / View</span>
      </Button>
    </Link>
  )
}
