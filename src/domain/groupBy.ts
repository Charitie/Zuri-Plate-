/** Groups items into a record keyed by `keyOf(item)`, preserving input order within each group. */
export function groupBy<T, K extends string>(items: readonly T[], keyOf: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      (acc[keyOf(item)] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}
