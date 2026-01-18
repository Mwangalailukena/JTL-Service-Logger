import { db, LocalArticle } from "./db";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "it", "this", "that"
]);

export const SearchEngine = {
  tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  },

  async indexArticle(article: LocalArticle) {
    if (!article.firebaseId || article.deletedAt) return;

    const titleTokens = this.tokenize(article.title);
    const contentTokens = this.tokenize(article.content);
    const tagTokens = article.tags.flatMap(t => this.tokenize(t));

    const tokenScores = new Map<string, number>();

    // Weighting Strategy
    const addToMap = (tokens: string[], weight: number) => {
      tokens.forEach(t => {
        tokenScores.set(t, (tokenScores.get(t) || 0) + weight);
      });
    };

    addToMap(titleTokens, 10);   // Title matches are most important
    addToMap(tagTokens, 5);      // Tags are high value
    addToMap(contentTokens, 1);  // Content mentions are standard

    await db.transaction('rw', db.searchIndex, async () => {
      const words = Array.from(tokenScores.keys());
      // Fetch existing entries for these words to append/update
      const entries = await db.searchIndex.bulkGet(words);
      
      const toPut: any[] = [];
      
      words.forEach((word, i) => {
         const existing = entries[i];
         const score = tokenScores.get(word)!;
         
         if (existing) {
             // Remove previous score for this article if it exists (update scenario)
             const cleanRefs = existing.refs.filter(r => r.id !== article.firebaseId);
             cleanRefs.push({ id: article.firebaseId, score });
             existing.refs = cleanRefs;
             toPut.push(existing);
         } else {
             toPut.push({ word, refs: [{ id: article.firebaseId, score }] });
         }
      });
      
      if (toPut.length > 0) {
        await db.searchIndex.bulkPut(toPut);
      }
    });
  },

  /**
   * Search for articles matching the query.
   * Returns a list of Article IDs sorted by relevance.
   */
  async search(query: string): Promise<string[]> {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) return [];

    const docScores = new Map<string, number>();

    // Parallel search for each token
    await Promise.all(tokens.map(async (token) => {
       // Use prefix matching for better UX (e.g. "sol" -> "solar")
       const matches = await db.searchIndex
         .where('word')
         .startsWith(token)
         .limit(5) // Limit index scan per token
         .toArray();

       matches.forEach(match => {
          match.refs.forEach(ref => {
             docScores.set(ref.id, (docScores.get(ref.id) || 0) + ref.score);
          });
       });
    }));

    // Convert to sorted array of IDs
    return Array.from(docScores.entries())
      .sort((a, b) => b[1] - a[1]) // Descending score
      .map(entry => entry[0]);
  },

  /**
   * Rebuild the entire index from local articles.
   * Useful for migrations or data resets.
   */
  async rebuildIndex() {
    await db.searchIndex.clear();
    const articles = await db.articles.toArray();
    for (const article of articles) {
      await this.indexArticle(article);
    }
    console.log(`Rebuilt search index for ${articles.length} articles.`);
  }
};
