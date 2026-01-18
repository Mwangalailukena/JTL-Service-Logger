// Mock Seeder for Knowledge Base - Run once in console or useEffect to test
import { db } from "@/lib/db";

export async function seedKB() {
  const count = await db.articles.count();
  if (count > 0) return;

  const articles = [
    {
      firebaseId: "kb_01",
      title: "Victron Inverter Config Guide",
      category: "solar",
      content: "## Configuration Steps\n\n1. Connect VE.Direct cable.\n2. Open VictronConnect App.\n3. Select your device...",
      tags: ["victron", "inverter", "setup"],
      lastUpdated: Date.now(),
      isPinned: 0,
    },
    {
      firebaseId: "kb_02",
      title: "Unifi Point-to-Point Alignment",
      category: "ict",
      content: "## Alignment Best Practices\n\nEnsure clear line of sight. Use the alignment tool in the dashboard...",
      tags: ["ubiquiti", "wireless", "p2p"],
      lastUpdated: Date.now(),
      isPinned: 0,
    }
  ];

  const attachments = [
    {
        id: "kb/attachments/victron_manual.pdf",
        articleId: "kb_01",
        name: "Victron Manual.pdf",
        size: 1024 * 500,
        type: "application/pdf",
        isDownloaded: 0
    }
  ];

  // @ts-ignore
  await db.articles.bulkAdd(articles);
  // @ts-ignore
  await db.attachments.bulkAdd(attachments);
  console.log("KB Seeded");
}
