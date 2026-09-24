import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

export const FEED_PAGE_SIZE = 20;
// Firestore "in" filters accept at most 30 values
const MAX_IN_VALUES = 30;

// Pages through posts by `authorIds`, newest first. Each group of up to 30
// authors is its own query with its own cursor; pages are merged by date.
export const createFeedCursor = (authorIds) => {
  const groups = [];
  for (let i = 0; i < authorIds.length; i += MAX_IN_VALUES) {
    groups.push({
      ids: authorIds.slice(i, i + MAX_IN_VALUES),
      buffer: [],
      lastDoc: null,
      done: false,
    });
  }

  const fill = async (group) => {
    const constraints = [
      where("createdBy", "in", group.ids),
      orderBy("createdAt", "desc"),
      limit(FEED_PAGE_SIZE),
    ];
    if (group.lastDoc) constraints.push(startAfter(group.lastDoc));

    const snapshot = await getDocs(query(collection(firestore, "posts"), ...constraints));
    group.buffer.push(...snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    if (snapshot.docs.length > 0) group.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.docs.length < FEED_PAGE_SIZE) group.done = true;
  };

  const nextPage = async () => {
    await Promise.all(
      groups.filter((g) => !g.done && g.buffer.length < FEED_PAGE_SIZE).map(fill)
    );

    const page = [];
    while (page.length < FEED_PAGE_SIZE) {
      // A group that ran dry but has more on the server could hold newer
      // posts than the others' buffers, so stop and fetch again next page
      if (groups.some((g) => !g.done && g.buffer.length === 0)) break;
      let newest = null;
      for (const g of groups) {
        if (g.buffer.length && (!newest || g.buffer[0].createdAt > newest.buffer[0].createdAt)) {
          newest = g;
        }
      }
      if (!newest) break;
      page.push(newest.buffer.shift());
    }

    const hasMore = groups.some((g) => !g.done || g.buffer.length > 0);
    return { posts: page, hasMore };
  };

  return { nextPage };
};
