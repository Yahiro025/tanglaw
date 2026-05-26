import { Request, Response } from "express";
import { getMockScholarships } from "../services/scholarshipService";

export const getScholarships = (_req: Request, res: Response) => {
  const scholarships = getMockScholarships();

  res.json({
    count: scholarships.length,
    data: scholarships,
  });
};
