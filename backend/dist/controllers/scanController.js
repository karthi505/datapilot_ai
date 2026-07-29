import { prisma } from "../lib/prisma.js";
import { scanAndProcessSchema } from "../services/scanService.js";

// POST /api/scan/trigger  (admin only)
export const triggerScan = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const dbConnection = await prisma.databaseConnection.findFirst({
      where: { companyId, isActive: true },
    });

    if (!dbConnection) {
      return res.status(404).json({
        success: false,
        message: "No active database connection found. Please add a connection first.",
      });
    }

    // Block duplicate scans
    const existing = await prisma.processedSchema.findUnique({
      where: { companyId },
    });

    if (existing?.scanStatus === "SCANNING") {
      return res.status(409).json({
        success: false,
        message: "A scan is already in progress. Poll /api/scan/status to check progress.",
      });
    }

    // Fire and forget — client polls for status
    scanAndProcessSchema(companyId).catch(err =>
      console.error("Background scan error:", err.message)
    );

    res.status(202).json({
      success: true,
      message: "Scan started successfully.",
      data: {
        hint: "Poll GET /api/scan/status to track progress",
      },
    });
  } catch (error) {
    console.error("Trigger Scan Error:", error);
    res.status(500).json({ success: false, message: "Server error while starting scan" });
  }
};

// GET /api/scan/status  (admin only)
export const getScanStatus = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const processed = await prisma.processedSchema.findUnique({
      where: { companyId },
    });

    if (!processed) {
      return res.status(404).json({
        success: false,
        message: "No scan found for your company. Trigger a scan first via POST /api/scan/trigger.",
      });
    }

    const tables = Array.isArray(processed.tables) ? processed.tables : [];

    res.status(200).json({
      success: true,
      data: {
        scanStatus: processed.scanStatus,
        lastScannedAt: processed.lastScannedAt,
        scanError: processed.scanError || null,
        tablesProcessed: tables.length,
        // Show per-table scan health
        tables: tables.map(t => ({
          name: t.name,
          hasDescription: !!t.description,
          rowCount: t.rowCount ?? null,
          scanError: t.scanError || null,
        })),
      },
    });
  } catch (error) {
    console.error("Get Scan Status Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching scan status" });
  }
};