// src/utils/activityLogger.js
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logActivity = async (action, details, target) => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "audit_logs"), {
      action: action,
      performedBy: user ? (user.displayName || user.email) : "Sistem",
      details: details,
      targetId: target || "",
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Gagal merekod audit log:", error);
  }
};