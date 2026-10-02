import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { ShoppingListItemRow } from '@/components/ShoppingListItemRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { shoppingRepo } from '@/data/repositories/shoppingRepo';
import { calendarRepo } from '@/data/repositories/calendarRepo';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { aggregateShoppingList } from '@/domain/shoppingAggregator';
import { groupBy } from '@/domain/groupBy';
import { ShoppingListItem } from '@/data/types';
import { CATEGORY_LABEL, SHOPPING_CATEGORIES } from '@/domain/shoppingCategories';
import { addDaysIso } from '@/services/dateService';
import { reportError } from '@/services/errors';
import { useToday } from '@/hooks/useToday';


export function ShoppingListScreen() {
  const today = useToday();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await shoppingRepo.listAll());
    } catch (e) {
      reportError(e, "Couldn't load your shopping list.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const entries = await calendarRepo.listByDateRange(today, addDaysIso(today, 6));
      const mealIds = [...new Set(entries.map((e) => e.mealId))];
      const ingredientsByMealId = await mealsRepo.getIngredientsForMeals(mealIds);
      await shoppingRepo.replaceList(aggregateShoppingList({ entries, ingredientsByMealId }));
      await load();
    } catch (e) {
      reportError(e, "Couldn't generate the list. Your previous list is unchanged.");
    } finally {
      setGenerating(false);
    }
  };

  const toggle = async (id: string, checked: boolean) => {
    try {
      await shoppingRepo.setChecked(id, checked);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
    } catch (e) {
      reportError(e, "Couldn't update that item.");
    }
  };

  const sections = useMemo(() => {
    const grouped = groupBy(items, (i) => i.category);
    return SHOPPING_CATEGORIES.filter((c) => grouped[c]).map((c) => [c, grouped[c]] as const);
  }, [items]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1} accessibilityRole="header">
          Shopping List
        </Text>
        <PrimaryButton
          title="Generate from plan"
          size="small"
          onPress={handleGenerate}
          loading={generating}
          accessibilityHint="Builds a list from the next 7 days of your plan"
        />
      </View>

      <FlatList
        data={sections}
        keyExtractor={([category]) => category}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: [category, categoryItems] }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.categoryLabel} accessibilityRole="header">
              {CATEGORY_LABEL[category]}
            </Text>
            {categoryItems.map((item) => (
              <ShoppingListItemRow key={item.id} item={item} onToggle={(checked) => toggle(item.id, checked)} />
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>{"No list yet — generate one from this week's plan."}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  header: { marginBottom: 16, gap: 10 },
  categoryLabel: { ...typography.bodyBold, color: colors.primary, marginBottom: 6, textTransform: 'uppercase', fontSize: 12 },
});
