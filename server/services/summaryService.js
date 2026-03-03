// services/summaryService.js

import { generateTemplateSummaries } from "./summaryGenerator.js";
import { generateAISummaries } from "../utils/aiSummaryGenerator.js";

/**
 * This function is what your route calls
 * UI never cares whether AI is used or not
 */
export const getResumeSummaries = async ({
  useAI = false,
  role,
  skills,
  experienceCount,
  education,
}) => {
  if (!useAI) {
    return generateTemplateSummaries({
      role,
      skills,
      experienceCount,
      education,
    });
  }

  return await generateAISummaries({
    role,
    skills,
    experienceCount,
    education,
  });
};