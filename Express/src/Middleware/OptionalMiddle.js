
import jwt from "jsonwebtoken";
import asyncHandler from "../Utils/AsyncHandler.js";
import { CreateAccessToken } from "../Utils/AuthUtils.js";
import dotenv from "dotenv";

dotenv.config();

const OptionalAuthUser = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  if (!accessToken && !refreshToken) {
    req.user = { id: null, role: "anonymous" };
    return next();
  }

  try {
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decodedToken;
    return next();
  } catch (err) {
    console.log("Access token expired or invalid:", err.message);
  }

  if (!refreshToken) {
    req.user = { id: null, role: "anonymous" };
    return next();
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = {
      id: decodedRefresh._id,
      fullName: decodedRefresh.fullName,
      email: decodedRefresh.email,
    };

    const newAccessToken = CreateAccessToken(user.fullName, user.id, user.email);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 10 * 60 * 1000,
      path: "/",
    });

    req.user = user;
    return next();
  } catch (err) {
    console.log("Refresh token expired or invalid:", err.message);
    req.user = { id: null, role: "anonymous" };
    return next();
  }
});

export default OptionalAuthUser;
