import asyncHandler from "../Utils/AsyncHandler.js";
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import prisma from "../Utils/PrismaClient.js";
import bcrypt from 'bcrypt';
import { CreateAccessToken,CreateRefreshToken } from "../Utils/AuthUtils.js";
import dotenv from "dotenv"
import jwt from "jsonwebtoken";
import sendResetmail from "../Utils/Mailutils.js"
dotenv.config()

const RegisterUser=asyncHandler(async(req,res)=>{
    const {fullName,password,email}=req.body;

    if(!fullName || !password || !email){
        throw new ApiError(404,"please include all data")
    }
    const alreadyExists=await prisma.user.findFirst({where:{
        email:email || fullName
    }})
     const hashedPassword = await bcrypt.hash(password, 10);
     
    if(alreadyExists){
        return res.send(new ApiResponse(401,'email or username already exists'))
    }
    const newUser=await prisma.user.create({

        data:{
            email,
            fullName,
            password:hashedPassword
        }
    })
    return res.send(new ApiResponse(200,'user created succesfully'))
})


const LoginUser = asyncHandler(async (req, res) => {
  const { email, password, remember_me } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide both email and password");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const newRefreshToken = CreateRefreshToken(user.fullName, user.id, user.email);
  const newAccessToken = CreateAccessToken(user.fullName, user.id, user.email);

  // Set cookies
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: false,
    maxAge: 10 * 60 * 1000,
      path: "/",
  });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  return res.status(200).json(
    new ApiResponse(200, "User logged in successfully", {
      user: { id: user.id, email: user.email, fullName: user.fullName },
    })
  );
});

const ForgotPassword=asyncHandler(async(req,res)=>{
  const {email}=req.body;
  if(!email)throw new ApiError(400,'please fill the email in form')
  const existingUser=await prisma.user.findFirst({
    where:{
      email:email
    }
  })
  if(!email){
    throw new ApiError(404,'invalid email address')
  }
  const token=jwt.sign(
    {userId:existingUser.id},
      process.env.JWT_SECRET,{
        expiresIn:"15m"
      }
  )    
  console.log("genrated token is jwt",token)
  if(!token){
    throw new ApiError(400,'failed to genrate reset token')
  } 
  const url=process.env.FRONTEND_URL
  sendResetmail(email,existingUser.fullName,token,url)
  return res.send(new ApiResponse(200,'password reset link has been mailed')) 
})


const ChangePassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;

  if (!password) throw new ApiError(400, "Please enter new password");
  if (!token) throw new ApiError(400, "Token is required");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Reset link has expired. Please request a new one.");
    }
    throw new ApiError(401, "Invalid or tampered reset token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new ApiError(404, "User not found");

  if (payload.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
    throw new ApiError(401, "Reset link has already been used.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),     },
  });

  return res.send(new ApiResponse(200, "Password changed successfully"));
});

const LogoutUser=asyncHandler(async(req,res)=>{
  if(!req.user)throw new ApiError(404,'forbidden req')

res.clearCookie("accessToken", {
  httpOnly: true,
  secure: false,
  path: "/",
});

res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: false,
  path: "/",
});

res.status(200).json({ message: "User loggedOut successfully" });
})

const DownloadApp=asyncHandler(async(req,res)=>{
  throw new ApiError(403,'comming soon')
})

export {
    LoginUser,RegisterUser,ForgotPassword,ChangePassword,LogoutUser,DownloadApp}
