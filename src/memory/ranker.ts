import { MemoryItem } from './vault';
import { tokenOverlapScore } from './semantic';

export function compositeScore(item: MemoryItem, query: string) {
  const sem = tokenOverlapScore(item.key + ' ' + item.value, query);
  const recency = Math.max(0, 1 - (Date.now() - item.lastAccessedAt) / (1000 * 60 * 60 * 24 * 30));
  const freq = Math.min(1, item.accessCount / 10);
  const importance = item.importance || 0.5;
  return sem * 0.6 + importance * 0.25 + recency * 0.1 + freq * 0.05;
}
