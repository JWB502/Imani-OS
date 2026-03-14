import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}