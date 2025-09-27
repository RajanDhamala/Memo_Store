import express from "express"
import { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import UserRouter from "./src/Routes/UserRouter.js"
import MemoRouter from "./src/Routes/MemoRouter.js"
const app=express()
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(urlencoded({extended:true}))
app.use(cookieParser())
app.use(express.json())
app.get("/",(req,res)=>{
    console.log("server is being called")
    return res.send("server is up and running")
})

app.use("/user",UserRouter)
app.use("/memo",MemoRouter)




app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});




export default app
