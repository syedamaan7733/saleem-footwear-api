require("dotenv").config();
require("express-async-errors");
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const packageInfo = require("./package.json");

// Packages
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { default: helmet } = require("helmet");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Connect DB
const connectDB = require("./db/connect");

// Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.set("trust proxy", 1);
app.use(helmet());
const defaultOrigins = [
  "http://localhost:8081",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://192.168.162.84:5173",
  "http://10.174.183.231:5173",
  "http://172.18.128.1:5173",
  "http://110.224.164.18:8081",
  "exp://110.224.164.18:8081",
  "https://salimfootwear.com",
  "https://workholi.netlify.app",
  "https://neon-kheer-10511f.netlify.app",
];

const extraOrigins = process.env.CORS_EXTRA_ORIGINS
  ? process.env.CORS_EXTRA_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (defaultOrigins.includes(origin) || extraOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(8081|8082|19000|19006)$/.test(origin)) {
        return callback(null, true);
      }
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
  })
);
app.use(cookieParser(process.env.JWT_SECRET));

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);
app.use((req, res, next) => {
  res.setHeader("X-API-Version", packageInfo.version);
  next();
});

app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    version: packageInfo.version,
    uptime: process.uptime(),
  });
});
// Routes
const authRouter = require("./routes/authRoutes");
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const orderRouter = require("./routes/orderRoutes");
const cartRouter = require("./routes/cartRoutes");
const searchRouter = require("./routes/searchRoute");
const botRouter = require("./routes/botRoutes");
const promotionRouter = require("./routes/promotionRoutes");
const uploadImgRouter = require("./utils/multer");

app.use("/api/v1", uploadImgRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/promotions", promotionRouter);
app.use("/bot", botRouter);


app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start server
const port = process.env.PORT || 8000;

module.exports = app;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log("db is live");
      console.log(`Server is listening on PORT:${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

if (require.main === module) {
  start();
}
