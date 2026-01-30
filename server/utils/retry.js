export const retry = async (fn, retries = 2, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const status =
        error?.status ||
        error?.response?.status ||
        error?.errorDetails?.[2]?.retryDelay;

      // Handle Gemini rate limit (429)
      if (error?.status === 429) {
        console.warn(
          `⚠️ Gemini quota exceeded. Retry ${i + 1}/${retries} in ${delay}ms`
        );

        if (i === retries - 1) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      // Any other error → fail fast
      throw error;
    }
  }
};
