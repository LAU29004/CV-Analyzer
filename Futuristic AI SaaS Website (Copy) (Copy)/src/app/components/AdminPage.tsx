import { useEffect, useState } from "react";
import { getAllUsers } from "../services/adminService";
import { auth } from "../config/firebase";
import { Users, Mail, Shield, Loader, Phone } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!auth.currentUser) {
          setError("User not authenticated");
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const data: User[] = await getAllUsers(token);

        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 text-violet-400 animate-spin" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-red-400 flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <p className="text-muted-foreground">Manage all users in the system</p>
        </div>

        {/* Users Count Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-violet-500/30 bg-violet-500/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-violet-400 mt-1">{users.length}</p>
              </div>
              <Users className="w-10 h-10 text-violet-400/50" />
            </div>
          </div>

          <div className="p-6 rounded-lg border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {users.filter(u => u.role === "admin").length}
                </p>
              </div>
              <Shield className="w-10 h-10 text-amber-400/50" />
            </div>
          </div>

          <div className="p-6 rounded-lg border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regular Users</p>
                <p className="text-3xl font-bold text-cyan-400 mt-1">
                  {users.filter(u => u.role === "user").length}
                </p>
              </div>
              <Users className="w-10 h-10 text-cyan-400/50" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        {users.length > 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-left">
                      <span className="text-sm font-semibold text-muted-foreground">Name</span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        Email
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        Phone
                      </span>
                    </th>
                    <th className="px-6 py-4 text-left">
                      <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Shield className="w-4 h-4" />
                        Role
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user, idx) => (
                    <tr
                      key={user._id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-muted-foreground truncate">
                          {user.phoneNumber || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                              : "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            user.role === "admin" ? "bg-amber-400" : "bg-cyan-400"
                          }`}></span>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
