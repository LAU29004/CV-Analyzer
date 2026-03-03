import mammoth from 'mammoth';
import pdfParse from 'pdf-parse-fork';

/**
 * Parse resume file (PDF or DOCX) and extract text content
 * @param {Object} file - Multer file object with buffer
 * @returns {Promise<string>} Extracted text from resume
 */
export async function parseResume(file) {
  if (!file || !file.buffer) {
    throw new Error('Invalid file provided');
  }

  try {
    // Handle PDF files
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or unreadable');
      }
      
      return data.text;
    }

    // Handle DOCX files
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname?.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX appears to be empty or unreadable');
      }
      
      return result.value;
    }

    // Unsupported file type
    throw new Error(
      `Unsupported file type: ${file.mimetype}. Please upload PDF or DOCX files only.`
    );
  } catch (error) {
    console.error('Error parsing resume:', error);
    
    // Re-throw with more context
    if (error.message.includes('Unsupported file type')) {
      throw error;
    }
    
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}