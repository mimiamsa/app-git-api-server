require("dotenv").config();
require("./config/mongoconfig");

const express = require('express');
const cors = require("cors");
const app = express()
const session = require("express-session")
const cookieParser = require("cookie-parser")

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  
}))
app.use(cors({
  credentials: true,
  origin: process.env.REACT_DOMAIN,
  // Access-Control-Allow-Origin: *
}));


const index = require("./routes/index"); 

app.use("/", index) 

const listener = app.listen(process.env.PORT, () => {
  console.log(`your app started at http://localhost:${listener.address().port}`)
})