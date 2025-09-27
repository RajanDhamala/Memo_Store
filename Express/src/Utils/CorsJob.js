
import fs from "fs"

async function cleanupOldFiles() {
  try {
    const oldUploads = await prisma.upload.findMany({
      where: {
        uploadedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),        },
      },
    });

    for (const upload of oldUploads) {
      fs.unlink(upload.path, (err) => {
        if (err) console.error("Failed to delete file:", upload.path, err);
      });

      await prisma.upload.delete({ where: { id: upload.id } });
    }

    console.log(`${oldUploads.length} old files deleted on startup.`);
  } catch (err) {
    console.error("Error deleting old files on startup:", err);
  }
}

export default cleanupOldFiles
