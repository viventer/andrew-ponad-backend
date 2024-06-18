require("dotenv").config();

const express = require("express");
const app = express();

const path = require("path");
const cookieParser = require("cookie-parser");

const cors = require("cors");
const corsOptions = require("./config/corsOptions");

const { logger, logEvents } = require("./middleware/logEvents");
const {
  allRequestsLimiter,
  loginAttemptsLimiter,
  reportErrorRequestsLimiter,
} = require("./config/rateLimiters");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const credentials = require("./middleware/credentials");

const { createProxyMiddleware } = require("http-proxy-middleware");

const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");

const PORT = process.env.PORT || 3500;

connectDB();

app.use(logger);

app.use(credentials);

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: false }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

app.use(cookieParser());

app.use(allRequestsLimiter);
app.use("/login", loginAttemptsLimiter);
app.post("/errorReports", reportErrorRequestsLimiter);

app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/login"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use("/posts", require("./routes/api/postRoutes"));
app.use("/errorReports", require("./routes/api/errorReportRoutes"));

app.use(verifyJWT(true));
app.use("/users", require("./routes/api/userRoutes"));
app.use("/categories", require("./routes/api/categoryRoutes"));

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("text").send("404 Not Found");
  }
});

app.use(errorHandler);

app.use(
  "/",
  createProxyMiddleware({ target: "http://127.0.0.1:5173", changeOrigin: true })
);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
