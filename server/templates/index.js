// templates/index.js
import { renderStandardTemplate } from "./standard.js";
import { renderModernTemplate } from "./modern.js";
import { renderMinimalTemplate } from "./minimal.js";

export const renderResumeByTemplate = (doc, resume, template) => {
  switch (template) {
    case "modern":
      return renderModernTemplate(doc, resume);
    case "minimal":
      return renderMinimalTemplate(doc, resume);
    case "standard":
    default:
      return renderStandardTemplate(doc, resume);
  }
};