import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useMealsStore } from '@/store/useMealsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MealsStackParamList } from '@/app/navigationTypes';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealLibraryHome'>;

export function MealLibraryScreen({ navigation }: Props) {
  const meals = useMealsStore((s) => s.meals);
  const loading = useMealsStore((s) => s.loading);
  const error = useMealsStore((s) => s.error);
  const loadAll = useMealsStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h1} accessibilityRole="header">
          Meals
        </Text>
        <PrimaryButton title="+ Create Meal" size="small" onPress={() => navigation.navigate('MealEditor')} />
      </View>

      <FlatList
        data={meals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        refreshing={loading}
        onRefresh={loadAll}
        renderItem={({ item }) => {
          const summary = `${item.type} · ${item.proteinG}g · ${item.servings} serving${item.servings > 1 ? 's' : ''}`;
          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('MealDetail', { mealId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${summary}`}
            >
              <Text style={typography.bodyBold}>{item.name}</Text>
              <Text style={{ color: colors.textMuted }}>{summary}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: error ? colors.danger : colors.textMuted }}>
            {error ? "Couldn't load meals. Pull down to retry." : 'No meals yet — add your favourites.'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  row: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, gap: 4 },
});
