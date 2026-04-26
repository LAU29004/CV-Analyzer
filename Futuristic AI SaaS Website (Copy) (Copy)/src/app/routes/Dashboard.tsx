import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { JSX } from "react";

const DashboardRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div>Loading...</div>;

  //if (!user) return <Navigate to="/" />;

  //if (!isAdmin) return <Navigate to="/dashboard/resume-upload" />;

  return children;
};

export default DashboardRoute;
