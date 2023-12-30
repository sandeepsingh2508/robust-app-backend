const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const cors = require("cors");
const connectDB = require("./db/connect");
require("dotenv").config();
const bodyParser = require("body-parser");

//route imports
const userRoutes = require("./routes/user");

//middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));
app.use(cors());

//route middleware
app.use("/api/v1", userRoutes);

//test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Salon server is running" });
});

//connection to database
connectDB(process.env.MONGO_URI);

//server listenng
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
