

import fs from "fs/promises";
import path from "path";
import cron from "node-cron";
import prisma from "../Utils/PrismaClient.js";

const UPLOAD_DIR = "/home/rajandhamala/Desktop/MemoSaver/Express/uploads/txt";

// Cleanup function for dev: 30 sec
const cleanupOldFiles = async () => {
  console.log("⏳ Running dev file cleanup job...");

  try {
    const files = await fs.readdir(UPLOAD_DIR);
   await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        const stats = await fs.stat(filePath);

        const fileAge = Date.now() - stats.birthtimeMs;

    
        if (fileAge > 24 * 60 * 60 * 1000) { // 24 hours
          try {
            await fs.unlink(filePath);
            console.log(` Deleted dev file: ${file}`);

         const deletedCount = await prisma.upload.deleteMany({
          where: { filename: file },
        });

        if (deletedCount.count > 0) {
        console.log(`Removed DB record for file: ${file}`);
}          } catch (err) {
            console.error(`Error deleting file ${file}:`, err.message);
          }
        }
      })
    );

  } catch (err) {
    console.error("Error during cleanup:", err.message);
  }
};


// Cron every hour
cron.schedule("0 * * * *", cleanupOldFiles);


export default cleanupOldFiles;

