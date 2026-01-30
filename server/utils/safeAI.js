export const safeAI = async (aiFn, fallbackFn) => {
  try {
    const result = await aiFn();
    if (!result || typeof result !== "object") {
      throw new Error("AI returned invalid result");
    }
    return result;
  } catch (err) {
    console.warn("AI skipped:", err.message);
    return fallbackFn();
  }
};
