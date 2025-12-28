import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const singleFileUpload = (destPath = "uploads/txt", fieldName = "file") => {
  const uploadDir = path.join(__dirname, "..", "..", destPath);

  console.log("UPLOAD DIR FINAL =", uploadDir);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${Date.now()}${ext}`);
    },
  });

  return multer({ storage }).single(fieldName);
};

export default singleFileUpload;
