// src/components/ProtectedRoute.jsx
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  return children;
}
