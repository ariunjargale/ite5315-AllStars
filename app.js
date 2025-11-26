const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const config = require("./config/database");
const path = require("path");

const app = express();

// MongoDB connection
mongoose
  .connect(config.url)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

const db = mongoose.connection;

/// Event logs
db.on("connected", () => console.log("Mongoose connected"));
db.on("error", (err) => console.error("Mongoose error:", err));
db.on("disconnected", () => console.log("Mongoose disconnected"));

// Event logs
db.on("connected", () => console.log("Mongoose connected"));
db.on("error", (err) => console.error("Mongoose error:", err));
db.on("disconnected", () => console.log("Mongoose disconnected"));

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "views", "partials"),
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {},
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Graceful shutdown
process.on("SIGINT", async () => {
  await db.close();
  console.log("Mongoose disconnected on app termination");
  process.exit(0);
});

// Load routes
const mainRoutes = require("./routes/mainRoutes");
// const characterRoutes = require("./routes/characterRoutes");
const episodeRoutes = require("./routes/episodeRoutes");
// const locationRoutes = require("./routes/locationRoutes");
app.use("/", mainRoutes);
app.use("/episodes", episodeRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: err.errors,
    });
  }
  res.status(500).json({ message: "Internal Server Error" });
});

// // Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// For Vercel deployment
// module.exports = app;
