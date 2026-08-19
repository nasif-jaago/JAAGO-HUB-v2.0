import { describe, it, expect } from "vitest";
import { MockStorageProvider } from "../src/storage/mock.storage.provider.js";
import { generateReferenceNumber } from "../src/reference-numbers/generator.js";

describe("Storage Abstraction & Reference Number Service", () => {
  describe("Reference Number Formatting", () => {
    it("formats purchase requisition reference with year, month and padded sequence", () => {
      const ref = generateReferenceNumber({
        documentType: "PURCHASE_REQUISITION",
        sequence: 42,
        date: new Date("2026-08-16"),
      });

      expect(ref).toBe("PR-2026-08-0042");
    });

    it("formats journal vouchers correctly", () => {
      const ref = generateReferenceNumber({
        documentType: "JOURNAL_VOUCHER",
        sequence: 5,
        date: new Date("2026-08-16"),
      });

      expect(ref).toBe("JV-2026-08-0005");
    });

    it("formats branch asset tags with location code", () => {
      const ref = generateReferenceNumber({
        documentType: "ASSET_TAG",
        sequence: 12,
        branchCode: "DHK",
        date: new Date("2026-08-16"),
      });

      expect(ref).toBe("AST-DHK-2026-0012");
    });
  });

  describe("File Storage Abstraction", () => {
    it("uploads and signs object URLs", async () => {
      const storage = new MockStorageProvider();
      const uploadRes = await storage.upload({
        bucket: "receipts",
        key: "vouchers/vch_101.pdf",
        buffer: Buffer.from("PDF_SAMPLE_DATA"),
        mimeType: "application/pdf",
        sizeBytes: 1024,
      });

      expect(uploadRes.bucket).toBe("receipts");
      expect(uploadRes.key).toBe("vouchers/vch_101.pdf");
      expect(uploadRes.url).toContain("vouchers/vch_101.pdf");

      const signedUrl = await storage.getSignedUrl("receipts", "vouchers/vch_101.pdf");
      expect(signedUrl).toContain("token=mock_signed_token");

      const deleteRes = await storage.delete("receipts", "vouchers/vch_101.pdf");
      expect(deleteRes.success).toBe(true);
    });
  });
});
