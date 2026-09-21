import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useMealsStore } from '@/store/useMealsStore';

export function MealLibraryScreen({ navigation }: any) {
  const meals = useMealsStore((s) => s.meals);
  const loadAll = useMealsStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1}>Meals</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('MealEditor', {})}>
          <Text style={styles.addButtonText}>+ Create Meal</Text>
        </Pressable>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('MealDetail', { mealId: item.id })}
          >
            <Text style={typography.bodyBold}>{item.name}</Text>
            <Text style={{ color: colors.textMuted }}>
              {item.type} · {item.proteinG}g · {item.servings} serving{item.servings > 1 ? 's' : ''}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textMuted }}>No meals yet — add your favourites.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  addButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addButtonText: { color: 'white', fontWeight: '700' },
  row: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, gap: 4 },
});
