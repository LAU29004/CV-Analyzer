export const getActiveModel = async (token: string): Promise<string> => {
  const response = await fetch("http://localhost:4000/api/admin/settings/model", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch active model");
  }

  const data = await response.json();
  return data.activeModel;
};

export const updateActiveModel = async (
  token: string,
  model: "Gemini" | "ChatGPT" | "Groq"
): Promise<string> => {
  const response = await fetch("http://localhost:4000/api/admin/settings/model", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model }),
  });

  if (!response.ok) {
    throw new Error("Failed to update active model");
  }

  const data = await response.json();
  return data.activeModel;
};

export const getAllUsers = async (token: string) => {
  const response = await fetch("http://localhost:4000/api/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await response.json();
  return data.users;
};
