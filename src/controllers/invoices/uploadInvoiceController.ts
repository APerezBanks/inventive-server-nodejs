import type { Request, Response, NextFunction } from "express";
import { generateErrorUtil } from "../../utils/index";
import { createWorker } from "tesseract.js";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";

const uploadInvoiceController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.files || !req.files.invoice) {
      throw generateErrorUtil("No file uploaded", 400);
    }

    // @ts-ignore
    const invoiceFile = req.files.invoice as fileUpload.UploadedFile;
    if (!process.env.UPLOADS_DIR)
      throw generateErrorUtil("Upload dir missing.");
    const uploadPath = path.join(process.env.UPLOADS_DIR, invoiceFile.name);

    // Save file to disk
    await invoiceFile.mv(uploadPath);

    // OCR
    const worker = await createWorker("eng");

    const {
      data: { text },
    } = await worker.recognize(uploadPath);

    await worker.terminate();
    await fs.unlink(uploadPath); // Clean up

    // Parse OCR text
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedItems = lines
      .map((line) => {
        const match = line.match(/^(.+?)\s+(\d+)\s*$/);
        if (match) {
          const [, productName, quantity] = match;
          return {
            productName,
            description: null,
            quantity: Number(quantity),
          };
        }
        return null;
      })
      .filter(Boolean);

    if (parsedItems.length === 0) {
      throw generateErrorUtil("No valid product lines found", 422);
    }

    res.status(200).send({
      status: "ok",
      message: "Invoice processed successfully",
      data: parsedItems,
    });
  } catch (err) {
    next(err);
  }
};

export default uploadInvoiceController;
