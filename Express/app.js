import express from "express"
import { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import UserRouter from "./src/Routes/UserRouter.js"
import MemoRouter from "./src/Routes/MemoRouter.js"
import client from "prom-client"


const app=express()
app.use(cors({
  origin:"http:ngixx port 80//localhost:5173",
  credentials:true
}))

app.use(urlencoded({extended:true}))
app.use(cookieParser())
app.use(express.json())

const collectDefaultMetrics=client.collectDefaultMetrics

collectDefaultMetrics({
  register:client.register
})

app.get("/",(req,res)=>{
    console.log("server is being called")
    return res.send("server is up and running")
})

app.get("/metrics",async(req,res)=>{
  res.setHeader('Content-Type',client.register.contentType)
  const metrics=await client.register.metrics();
  res.send(metrics)
})

app.get("/health", (req, res) => {
  res.status(200).send({
    status: "ok"
  });
});

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
