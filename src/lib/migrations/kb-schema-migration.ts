import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";

/**
 * Migration Script for Knowledge Base Schema
 * Adds 'version' and 'deletedAt' fields to existing documents.
 * 
 * Usage: Import this function in a temporary component or browser console
 * and execute it once.
 */
export async function migrateKBSchema() {
  console.log("Starting KB Schema Migration...");
  
  try {
    const querySnapshot = await getDocs(collection(db, "knowledge_base"));
    let updatedCount = 0;

    const updates = querySnapshot.docs.map(async (document) => {
      const data = document.data();
      const needsUpdate = data.version === undefined || data.deletedAt === undefined;

      if (needsUpdate) {
        await updateDoc(doc(db, "knowledge_base", document.id), {
          version: data.version || 1,
          deletedAt: data.deletedAt || null,
          // Ensure tags exist
          tags: data.tags || [],
          updatedAt: data.updatedAt || Timestamp.now()
        });
        updatedCount++;
      }
    });

    await Promise.all(updates);
    console.log(`Migration Complete. Updated ${updatedCount} documents.`);
    
  } catch (error) {
    console.error("Migration Failed:", error);
  }
}
