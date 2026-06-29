/**
 * Curated TMDB collection ids for Orbitra browse.
 * TMDB has no paginated "all collections" list; membership is resolved at runtime
 * via GET /collection/{id} (parts) and movie.belongs_to_collection on titles.
 *
 * @module server/utils/collectionCatalog
 */

/** Seed franchises / trilogies / universes (TMDB collection ids). */
export const COLLECTION_CATALOG_IDS: number[] = [
  263, // The Dark Knight Collection
  119, // The Lord of the Rings Collection
  1241, // Harry Potter Collection
  10, // Star Wars Collection
  86311, // The Avengers Collection
  645, // James Bond Collection
  9485, // The Fast and the Furious Collection
  87359, // Mission: Impossible Collection
  328, // Jurassic Park Collection
  2344, // The Matrix Collection
  8091, // Alien Collection
  399, // Predator Collection
  528, // The Terminator Collection
  1570, // Die Hard Collection
  404609, // John Wick Collection
  313086, // The Conjuring Collection
  656, // Saw Collection
  10194, // Toy Story Collection
  2150, // Shrek Collection
  8354, // Ice Age Collection
  86066, // Despicable Me Collection
  89137, // How to Train Your Dragon Collection
  77816, // Kung Fu Panda Collection
  295, // Pirates of the Caribbean Collection
  84, // Indiana Jones Collection
  264, // Back to the Future Collection
  1575, // Rocky Collection
  5039, // Rambo Collection
  304, // Ocean's Collection
  31562, // The Bourne Collection
  131635, // The Hunger Games Collection
  33514, // The Twilight Collection
  135416, // Three Flavours Cornetto Collection
  325470, // Before... Collection
  115777, // Three Colors Collection
  173710, // Planet of the Apes (Reboot) Collection
  748, // X-Men Collection
  556, // Spider-Man Collection
  120794, // Batman Collection
  8537, // Superman Collection
  468552, // DC Extended Universe Collection
  284433, // Guardians of the Galaxy Collection
  131296, // Thor Collection
  131295, // Captain America Collection
  422834, // Ant-Man Collection
  448150, // Deadpool Collection
  558216, // Venom Collection
  185849, // Transformers Collection
  535313, // Godzilla Collection (MonsterVerse)
  726871, // Dune Collection
  151, // The Godfather Collection
  87096, // Avatar Collection
  121938, // Creed Collection
  531242, // Spider-Man: Spider-Verse Collection
]

/** Deduped catalog ids for iteration. */
export function uniqueCatalogIds(): number[] {
  return [...new Set(COLLECTION_CATALOG_IDS.filter(n => Number.isFinite(n) && n > 0))]
}
