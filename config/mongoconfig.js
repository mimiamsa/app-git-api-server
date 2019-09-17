const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }
);

//"connected" is an event name from mongo
mongoose.connection.on("connected", () => {
  console.log("connected to db");
});

//"error" is an event name from mongo
mongoose.connection.on("error", () => {
  console.log("mongo connection failed");
});