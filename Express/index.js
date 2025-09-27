import dotenv from "dotenv"
import app from "./app.js"
import cleanupOldFiles from "./src/Utils/clean-up.js"

dotenv.config()


const PORT=process.env.PORT || 8000
app.listen(PORT,()=>{
        cleanupOldFiles() 
    console.log("server is running on port",PORT)
})
