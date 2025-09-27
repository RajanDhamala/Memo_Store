import { Router } from "express";
import { LoginUser,RegisterUser } from "../Controller/UserController.js";
import AuthUser from "../Middleware/AuthMidlle.js";
import { CreateFile,CreateFolder,AddLine,FolderList,FileInFolder,deleteFolder,deleteFile,deleteLine,editFileLine
  ,editFolderOrFileName,GetLines,FileUpload,DownloadFile,fileList } from "../Controller/MemoController.js";
import singleFileUpload from "../Middleware/uploadMiddleware.js";
import OptionalAuthUser from "../Middleware/OptionalMiddle.js";

const MemoRouter=Router()

MemoRouter.get('/',(req,res)=>{
  return res.send("memo router is working")
})


MemoRouter.post("/createFolder",AuthUser , CreateFolder);

MemoRouter.post("/createFile",AuthUser , CreateFile);

MemoRouter.post("/addLine", AuthUser, AddLine);

MemoRouter.get("/getLines/:fileId",AuthUser,GetLines)

MemoRouter.get("/folders",AuthUser,FolderList)

MemoRouter.get("/delete_folder/:folderId",AuthUser,deleteFolder)

MemoRouter.get("/file_folder/:folderId",AuthUser,FileInFolder)

MemoRouter.get("/delete_folder/:folderId",AuthUser,deleteFolder)

MemoRouter.get("/delete_file/:folderId/:fileId",AuthUser,deleteFile)

MemoRouter.get("/delete_line/:fileId/:lineId",AuthUser,deleteLine)

MemoRouter.post("/edit_line",AuthUser,editFileLine)

MemoRouter.post("/edit_names",AuthUser,editFolderOrFileName)

MemoRouter.post("/upload-txt",singleFileUpload("uploads/txt",'file'),OptionalAuthUser,FileUpload)

MemoRouter.post("/download",DownloadFile)

 MemoRouter.get("/get-files",fileList)

  


export default MemoRouter
