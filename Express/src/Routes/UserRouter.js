import { Router } from "express";
import { LoginUser,RegisterUser,ForgotPassword,ChangePassword,LogoutUser,DownloadApp } from "../Controller/UserController.js";
import AuthUser from "../Middleware/AuthMidlle.js";
import Whoareu from "../Middleware/meMiddle.js" 

const UserRouter=Router()


UserRouter.get("/",(req,res)=>{
    res.send("user route is up and running")
})


UserRouter.post("/login",LoginUser)
UserRouter.post("/register",RegisterUser)
UserRouter.get("/me",Whoareu)
UserRouter.post("/forgot_password",ForgotPassword)
UserRouter.post("/change-password",ChangePassword)
UserRouter.get("/logout",AuthUser,LogoutUser)
UserRouter.get("/download/:id",DownloadApp)
export default UserRouter
