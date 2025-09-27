
import multer from 'multer';
import fs from 'fs';
import path from 'path';


const singleFileUpload = (destPath = 'uploads', fieldName = 'file') => {
  const uploadDir = path.isAbsolute(destPath)
    ? destPath
    : path.join(process.cwd(), destPath);

  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${Date.now()}${ext}`);
    },
  });

  const upload = multer({ storage });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) return next(err);

      next();
    });
  };
};
 

export default singleFileUpload
