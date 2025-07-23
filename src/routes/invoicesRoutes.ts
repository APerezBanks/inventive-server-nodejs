import express from "express";

import uploadInvoiceController from "../controllers/invoices/uploadInvoiceController";

import { authUserMiddleware } from "../middlewares/index";

// ------------------------------------------
const router = express.Router();

router.post("/upload", authUserMiddleware, uploadInvoiceController);

export default router;
