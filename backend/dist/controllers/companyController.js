import { prisma } from "../lib/prisma.js";

export const getCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        companies,
        count: companies.length,
      },
    });
  } catch (error) {
    console.error("Get Companies Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching companies",
    });
  }
};
