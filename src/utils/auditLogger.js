// src/utils/auditLogger.js
import { db } from "../firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logAudit = async (action, performedBy, details) => {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action,
      performedBy,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Audit Log Failed:", error);
  }
};