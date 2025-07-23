// Environment variables from the .env file
import "dotenv/config";
const { PORT, UPLOADS_DIR } = process.env;

import "./types/express";
import cors from "cors";
// Dependencies
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fileUpload from "express-fileupload";
import morgan from "morgan";

// Routes
import {
  inventoriesRoutes,
  invoicesRoutes,
  productsRoutes,
  usersRoutes,
} from "./routes/index";
import { generateErrorUtil } from "./utils";
import type { CustomError } from "./utils/generateErrorUtil";

// ------------------------------------------
// Generating the server
const app = express();
app.use(fileUpload()); // Parses "form-data" body (for files)

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(morgan("dev")); // Query info on the console
app.use((req, res, next) => {
  if (req.is("application/json")) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

if (!UPLOADS_DIR) throw generateErrorUtil("Missing upload directory path");
app.use(express.static(UPLOADS_DIR));

// Middlewares which tell express where the routes are located
app.use("/api/users", usersRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/inventories", inventoriesRoutes);
app.use("/api/products", productsRoutes);

// Error-handling middleware
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  // NOTE: we use CustomError, which extends Error with httpStatus
  res.status(err.httpStatus || 500).send({
    status: "error",
    message: err.message,
  });
});

// 404 Route Not Found middleware
app.use((req, res) => {
  res.status(404).send({
    status: "error",
    message: "Route not found",
  });
});

// We open the server to listen to petitions from a given port
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
