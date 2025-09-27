import jwt from 'jsonwebtoken';
import dotenv from "dotenv"
dotenv.config()

const CreateAccessToken = (fullName,id,email) => {
    const payload = {
      _id: id,
      fullName,
      email,
    };
  
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  }
  
  const CreateRefreshToken = (fullName,id,email) => {
    const payload = {
      _id: id,
      email,
      fullName
    };
  
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  }

export {
    CreateAccessToken,
    CreateRefreshToken,
}