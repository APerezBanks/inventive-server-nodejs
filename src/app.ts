// ------------------------------
// Load environment variables
// ------------------------------
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import morgan from "morgan";
import mysql from "mysql2/promise";

import "./types/express";
import { inventoriesRoutes, invoicesRoutes, productsRoutes, usersRoutes } from "./routes/index";
import { generateErrorUtil } from "./utils";
import type { CustomError } from "./utils/generateErrorUtil";

const PORT = process.env.PORT || 8000;
const UPLOADS_DIR = process.env.UPLOADS_DIR;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ------------------------------
// Start server in async function
// ------------------------------
async function startServer() {
  // ------------------------------
  // MySQL connection (FreeDB)
  // ------------------------------
  const dbConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
  });

  console.log("✅ DB connected!");

  // ------------------------------
  // Create Express app
  // ------------------------------
  const app = express();
  app.use(fileUpload());

  // CORS: permite frontend local o remoto
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );

  app.use(morgan("dev")); // log requests
  app.use((req, res, next) => {
    if (req.is("application/json")) {
      express.json()(req, res, next);
    } else {
      next();
    }
  });

  if (!UPLOADS_DIR) throw generateErrorUtil("Missing upload directory path");
  app.use(express.static(UPLOADS_DIR));

  // ------------------------------
  // Routes
  // ------------------------------
  app.use("/api/users", usersRoutes);
  app.use("/api/invoices", invoicesRoutes);
  app.use("/api/inventories", inventoriesRoutes);
  app.use("/api/products", productsRoutes);

  // ------------------------------
  // Error-handling middleware
  // ------------------------------
  app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.httpStatus || 500).send({
      status: "error",
      message: err.message,
    });
  });

  // 404 Middleware
  app.use((req, res) => {
    res.status(404).send({
      status: "error",
      message: "Route not found",
    });
  });

  // ------------------------------
  // Start listening
  // ------------------------------
  app.listen(PORT, () => {
    console.log(`🚀 Server listening at http://localhost:${PORT}`);
  });
}

// Start the server
startServer().catch(err => {
  console.error("❌ Error starting server:", err);
});
