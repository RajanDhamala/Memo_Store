import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import prisma from "../Utils/PrismaClient.js";
import bcrypt from 'bcrypt';
import { CreateAccessToken,CreateRefreshToken } from "../Utils/AuthUtils.js";
import dotenv from "dotenv"
import fs from "fs";
import path from "path";
dotenv.config()


 const CreateFolder = asyncHandler(async (req, res) => {
  const { folderName } = req.body;
  if (!folderName || !req.user) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const createdFolder = await prisma.folder.create({
    data: {
      name: folderName,
      ownerId: req.user._id, 
    },
  });

  if (!createdFolder) {
    throw new ApiError(403, "Failed to create folder");
  }

  return res.send(new ApiResponse(200, "Successfully created the folder", createdFolder));
});

const CreateFile = asyncHandler(async (req, res) => {
  const { fileName, folderId } = req.body;

  if (!fileName || !folderId) {
    throw new ApiError(400, "Please fill all fields");
  }

  const folderExists = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folderExists) {
    throw new ApiError(404, "Folder not found");
  }

  const createdFile = await prisma.file.create({
    data: {
      title: fileName,
      folderId: folderId,
    },
  });

  if (!createdFile) {
    throw new ApiError(403, "Failed to create file");
  }

  return res.send(new ApiResponse(200, "Successfully created the file", createdFile));
});

const AddLine = asyncHandler(async (req, res) => {
  const { fileId, folderId, content } = req.body;

  if (!fileId || !folderId || !content) {
    throw new ApiError(400, "Please fill all fields");
  }

  const fileExists = await prisma.file.findUnique({ where: { id: fileId } });
  if (!fileExists) {
    throw new ApiError(404, "File not found");
  }

  const [addedLine] = await prisma.$transaction([
    prisma.fileLine.create({
      data: {
        content: content,
        fileId: fileId,
      },
    }),
    prisma.folder.update({
      where: { id: folderId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return res.send(new ApiResponse(200, "Successfully added the line", addedLine));
});



const FolderList = asyncHandler(async (req, res) => {
  console.log("folder list here");

  const userFolderList = await prisma.folder.findMany({
    where: {
      ownerId: req.user._id,
    },
    include: {
      _count: {
        select: { files: true },
      },
    },
  });

  if (!userFolderList || userFolderList.length === 0) {
    return res.send(new ApiResponse(201, "Folder list is empty", []));
  }

  return res.send(new ApiResponse(200, "Fetched the folder list", userFolderList));
});




const FileInFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  if (!folderId) throw new ApiError(400, "Include folder ID");

  const folderWithFiles = await prisma.folder.findFirst({
    where: {
      id: folderId,
      ownerId: req.user._id, 
    },
    include: {
      files: {
        include: {
          _count: {
            select: { lines: true }, // Only get the count of lines
          },
        },
      },
    },
  });

  if (!folderWithFiles) {
    throw new ApiError(403, "You do not have access to this folder");
  }

  const files = folderWithFiles.files || [];

  return res.send(
    new ApiResponse(
      files.length === 0 ? 201 : 200,
      files.length === 0 ? "No files in this folder" : "Fetched files in folder",
      files
    )
  );
});

const deleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  if (!folderId) throw new ApiError(400, "Include folderId in request");

  const deleted = await prisma.folder.deleteMany({
    where: {
      id: folderId,
      ownerId: req.user._id, // check ownership
    },
  });

  if (deleted.count === 0) {
    throw new ApiError(403, "You do not have access to this folder or it does not exist");
  }

  return res.send(new ApiResponse(200, "Folder deleted successfully", null));
});


const deleteFile = asyncHandler(async (req, res) => {
  const { folderId, fileId } = req.params;
  if (!folderId || !fileId) throw new ApiError(400, "Please provide folderId and fileId");

  const deleted = await prisma.file.deleteMany({
    where: {
      id: fileId,
      folderId: folderId,
      folder: {
        ownerId: req.user._id, 
      },
    },
  });

  if (deleted.count === 0) {
    throw new ApiError(403, "You do not have access to this file or it does not exist");
  }

  return res.send(new ApiResponse(200, "File deleted successfully", null));
});


const deleteLine = asyncHandler(async (req, res) => {
  const { fileId, lineId } = req.params;
  if (!fileId || !lineId) throw new ApiError(400, "Please provide fileId and lineId");

  const deleted = await prisma.fileLine.deleteMany({
    where: {
      id: lineId,
      fileId: fileId,
      file: {
        folder: {
          ownerId: req.user._id, 
},
      },
    },
  });

  if (deleted.count === 0) {
    throw new ApiError(403, "You do not have access to this file line or it does not exist");
  }

  return res.send(new ApiResponse(200, "File line deleted successfully", null));
});



const editFileLine = asyncHandler(async (req, res) => {
  const { fileId, lineId, newLine } = req.body;
  if (!fileId || !lineId || !newLine) throw new ApiError(400, "Please fill all fields");

  const updated = await prisma.fileLine.updateMany({
    where: {
      id: lineId,
      fileId: fileId,
      file: {
        folder: {
          ownerId: req.user._id,
        },
      },
    },
    data: {
      content: newLine,
    },
  });

  if (updated.count === 0) {
    throw new ApiError(403, "You do not have access to edit this line or it does not exist");
  }

  return res.send(new ApiResponse(200, "File line updated successfully", null));
});



const editFolderOrFileName = asyncHandler(async (req, res) => {
  const { type, editId, title } = req.body;
  console.log(req.body)
  if (!type || !editId || !title) {
    throw new ApiError(400, "please fill all the fields");
  }

  let update;

  if (type === "file") {
    update = await prisma.file.updateMany({
      where: {
        id: editId,
        folder: {
          ownerId: req.user._id, 
        },
      },
      data: {
        title: title,
      },
    });

    if (update.count === 0) {
      throw new ApiError(403, "Not authorized or file not found");
    }

    return res
      .status(202)
      .json(new ApiResponse(202, "Successfully updated the file title"));
  } else if (type === "folder") {
    update = await prisma.folder.updateMany({
      where: {
        id: editId,
        ownerId: req.user._id,
      },
      data: {
        name: title,
      },
    });

    if (update.count === 0) {
      throw new ApiError(403, "Not authorized or folder not found");
    }

    return res
      .status(202)
      .json(new ApiResponse(202, "Successfully updated the folder title"));
  } else {
    return res.status(400).send("Invalid request type");
  }
});


const GetLines = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) throw new ApiError(400, 'Please include file id in request');
  const fileWithLines = await prisma.file.findFirst({
    where: {
      id: fileId,
      folder: {
        ownerId: req.user._id,       },
    },
    include: {
      lines: {
        orderBy: {
          createdAt: 'asc', 
        },
      },
    },
  });

  if (!fileWithLines) {
    throw new ApiError(403, "You do not have access to this file or it does not exist");
  }

  return res.send(new ApiResponse(200, "Successfully fetched file lines", fileWithLines));
});




const FileUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  const { password } = req.body;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  console.log("file:",req.file)
  let hashedPassword = null;
  let isProtected = false;

  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
    isProtected = true;
  }

  const uploaderId = req.user?.id && req.user.role !== "anonymous" ? req.user.id : null;

  const newUpload = await prisma.upload.create({
    data: {
      mimetype: file.mimetype,
      originalName: file.originalname,
      path: file.path,
      filename: file.filename,
      size: file.size,
      uploaderId: uploaderId,
      isProtected,
      password: hashedPassword,
    },
  });

  return res.status(201).json({
    message: "File uploaded successfully",
    file: newUpload,
  });
});




const DownloadFile = asyncHandler(async (req, res) => {
  const { fileId, password } = req.body;
  if (!fileId) throw new ApiError(400, "Please include fileId in request");

  const fileRecord = await prisma.upload.findFirst({
    where: { id: fileId },
  });

  if (!fileRecord) throw new ApiError(404, "File does not exist");

    if (fileRecord.isProtected) {
    if (!password) throw new ApiError(400, "Password is required for this file");

    const isValid = await bcrypt.compare(password, fileRecord.password);
    if (!isValid) throw new ApiError(401, "Invalid password");
  }

  const filePath = path.resolve(fileRecord.path);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "File not found on server");
  }

  res.download(filePath, fileRecord.originalName, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error downloading file");
    }
  });
});



const fileList = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query; 
  const limit = 6; 
  const skip = (Number(page) - 1) * limit;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const totalCount = await prisma.upload.count({
    where: {
      uploadedAt: {
        gte: twentyFourHoursAgo,
      },
    },
  });

  const files = await prisma.upload.findMany({
    where: {
      uploadedAt: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: {
      uploadedAt: "desc",
    },
    select: {
      id: true,
      originalName: true,
      mimetype: true,
      size: true,
      uploadedAt: true,
      isProtected: true,
    },
    skip,
    take: limit,
  });

  res.status(200).json({
    success: true,
    count: files.length,
    page: Number(page),
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
    files,
  });
});


export {
  CreateFile,CreateFolder,AddLine,FolderList,FileInFolder,deleteFolder,deleteFile,deleteLine,editFileLine
  ,editFolderOrFileName,GetLines,FileUpload,DownloadFile,fileList
}
