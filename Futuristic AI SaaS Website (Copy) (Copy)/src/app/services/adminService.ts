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
