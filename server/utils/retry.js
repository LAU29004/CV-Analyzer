export const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Retry only on common transient model issues
      if (i === retries - 1 || !error.message.includes("503")) throw error;

      console.log(`Retry attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
};
