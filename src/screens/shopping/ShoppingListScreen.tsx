import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { ShoppingListItemRow } from '@/components/ShoppingListItemRow';
import { shoppingRepo } from '@/data/repositories/shoppingRepo';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { aggregateShoppingList } from '@/domain/shoppingAggregator';
import { ShoppingListItem, ShoppingCategory, MealIngredient } from '@/data/types';
import { todayIso, addDaysIso } from '@/services/dateService';

const CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  proteins: 'Proteins',
  carbs: 'Carbs',
  vegetables: 'Vegetables',
  other: 'Other',
};

export function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [generating, setGenerating] = useState(false);

  const load = async () => setItems(await shoppingRepo.listAll());

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const start = todayIso();
    const end = addDaysIso(start, 6);
    const entries = await calendarRepo.listByDateRange(start, end);

    const ingredientsByMealId: Record<string, MealIngredient[]> = {};
    for (const entry of entries) {
      if (!ingredientsByMealId[entry.mealId]) {
        ingredientsByMealId[entry.mealId] = await mealsRepo.getIngredients(entry.mealId);
      }
    }

    const aggregated = aggregateShoppingList({ entries, ingredientsByMealId });
    await shoppingRepo.replaceList(aggregated);
    await load();
    setGenerating(false);
  };

  const grouped = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1}>Shopping List</Text>
        <Pressable style={styles.generateButton} onPress={handleGenerate} disabled={generating}>
          <Text style={styles.generateButtonText}>{generating ? 'Generating…' : 'Generate from plan'}</Text>
        </Pressable>
      </View>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([category]) => category}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: [category, categoryItems] }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABEL[category as ShoppingCategory]}</Text>
            {categoryItems.map((item) => (
              <ShoppingListItemRow
                key={item.id}
                item={item}
                onToggle={async (checked) => {
                  await shoppingRepo.setChecked(item.id, checked);
                  load();
                }}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No list yet — generate one from this week's plan.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  header: { marginBottom: 16, gap: 10 },
  generateButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  generateButtonText: { color: 'white', fontWeight: '700' },
  categoryLabel: { ...typography.bodyBold, color: colors.primary, marginBottom: 6, textTransform: 'uppercase', fontSize: 12 },
});
