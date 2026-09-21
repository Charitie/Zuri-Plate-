import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { Meal, MealIngredient } from '@/data/types';

export function MealDetailScreen({ route, navigation }: any) {
  const { mealId } = route.params;
  const [meal, setMeal] = useState<Meal | null>(null);
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);

  useEffect(() => {
    (async () => {
      const m = await mealsRepo.getById(mealId);
      setMeal(m);
      setIngredients(await mealsRepo.getIngredients(mealId));
    })();
  }, [mealId]);

  if (!meal) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      {meal.photoUri && <Image source={{ uri: meal.photoUri }} style={styles.photo} />}
      <Text style={typography.h1}>{meal.name}</Text>
      <Text style={{ color: colors.textMuted }}>
        {meal.type} · {meal.proteinG}g protein · {meal.servings} serving{meal.servings > 1 ? 's' : ''}
      </Text>

      <View>
        <Text style={typography.bodyBold}>Ingredients</Text>
        {ingredients.map((ing) => (
          <Text key={ing.id} style={{ color: colors.text, marginTop: 4 }}>
            • {ing.name} — {ing.quantity} {ing.unit}
          </Text>
        ))}
      </View>

      <Pressable
        style={styles.editButton}
        onPress={() => navigation.navigate('MealEditor', { mealId: meal.id })}
      >
        <Text style={styles.editButtonText}>Edit meal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  photo: { width: '100%', height: 200, borderRadius: 14 },
  editButton: { backgroundColor: colors.primaryMuted, padding: 14, borderRadius: 10, alignItems: 'center' },
  editButtonText: { color: colors.primary, fontWeight: '700' },
});
