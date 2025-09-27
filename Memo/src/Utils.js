
// utils/crypto.js
import crypto from "crypto";

const secretKey = Buffer.from(process.env.VITE_SECRET_KEY_BASE64, "base64");

function encryptString(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // join iv, tag, data into one string
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptString(cipherText) {
  const [ivB64, tagB64, dataB64] = cipherText.split(":");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    secretKey,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
   

export {
  decryptString,encryptString
}
