import { db } from "./firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const MOCK_CLIENTS = [
  { id: "c1", name: "Copperbelt Energy Corp", type: "corporate", location: "Kitwe", contactPerson: "Mr. Banda" },
  { id: "c2", name: "Zamtel HQ", type: "corporate", location: "Lusaka", contactPerson: "Mrs. Phiri" },
  { id: "c3", name: "Farm 23 - Solar Project", type: "residential", location: "Mkushi", contactPerson: "John Doe" },
  { id: "c4", name: "Ministry of Health", type: "gov", location: "Lusaka", contactPerson: "Dr. Mumba" },
];

const MOCK_ARTICLES = [
  {
    id: "kb_01",
    title: "Victron Inverter Config Guide",
    category: "solar",
    content: "## Configuration Steps\n\n1. Connect VE.Direct cable.\n2. Open VictronConnect App.\n3. Select your device...",
    tags: ["victron", "inverter", "setup"],
    isPinned: true,
  },
  {
    id: "kb_02",
    title: "Unifi Point-to-Point Alignment",
    category: "ict",
    content: "## Alignment Best Practices\n\nEnsure clear line of sight. Use the alignment tool in the dashboard...",
    tags: ["ubiquiti", "wireless", "p2p"],
    isPinned: false,
  }
];

export async function seedFirestore() {
  console.log("Starting Firestore seed...");

  // Seed Clients
  for (const client of MOCK_CLIENTS) {
    const { id, ...data } = client;
    await setDoc(doc(db, "clients", id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Seeded client: ${client.name}`);
  }

  // Seed Knowledge Base
  for (const article of MOCK_ARTICLES) {
    const { id, ...data } = article;
    await setDoc(doc(db, "knowledge_base", id), {
      ...data,
      lastUpdated: serverTimestamp(),
    });
    console.log(`Seeded article: ${article.title}`);
  }

  console.log("Firestore seeding complete!");
}
