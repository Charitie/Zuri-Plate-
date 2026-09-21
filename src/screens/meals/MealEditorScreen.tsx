import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PhotoPicker } from '@/components/PhotoPicker';
import { useMealsStore } from '@/store/useMealsStore';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { MealType } from '@/data/types';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
}

export function MealEditorScreen({ route, navigation }: any) {
  const mealId: string | undefined = route.params?.mealId;
  const addMeal = useMealsStore((s) => s.addMeal);
  const updateMeal = useMealsStore((s) => s.updateMeal);

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('dinner');
  const [proteinG, setProteinG] = useState('0');
  const [servings, setServings] = useState('1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ name: '', quantity: '', unit: '' }]);

  useEffect(() => {
    if (!mealId) return;
    (async () => {
      const meal = await mealsRepo.getById(mealId);
      if (!meal) return;
      setName(meal.name);
      setType(meal.type);
      setProteinG(String(meal.proteinG));
      setServings(String(meal.servings));
      setPhotoUri(meal.photoUri);
      const existingIngredients = await mealsRepo.getIngredients(mealId);
      setIngredients(
        existingIngredients.map((i) => ({ name: i.name, quantity: String(i.quantity), unit: i.unit }))
      );
    })();
  }, [mealId]);

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };

  const addIngredientRow = () => setIngredients((prev) => [...prev, { name: '', quantity: '', unit: '' }]);

  const handleSave = async () => {
    const cleanIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), quantity: Number(i.quantity) || 0, unit: i.unit.trim() || 'unit' }));

    const input = {
      name: name.trim(),
      type,
      proteinG: Number(proteinG) || 0,
      servings: Number(servings) || 1,
      photoUri,
      ingredients: cleanIngredients,
    };

    if (mealId) {
      await updateMeal(mealId, input);
    } else {
      await addMeal(input);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Text style={typography.h1}>{mealId ? 'Edit Meal' : 'New Meal'}</Text>

      <PhotoPicker photoUri={photoUri} onChange={setPhotoUri} />

      <TextInput style={styles.input} placeholder="Meal name" value={name} onChangeText={setName} />

      <View style={styles.typeRow}>
        {MEAL_TYPES.map((t) => (
          <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipSelected]} onPress={() => setType(t)}>
            <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Protein (g)"
          keyboardType="numeric"
          value={proteinG}
          onChangeText={setProteinG}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Servings"
          keyboardType="numeric"
          value={servings}
          onChangeText={setServings}
        />
      </View>

      <Text style={typography.bodyBold}>Ingredients</Text>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Ingredient"
            value={ing.name}
            onChangeText={(v) => updateIngredient(index, { name: v })}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Qty"
            keyboardType="numeric"
            value={ing.quantity}
            onChangeText={(v) => updateIngredient(index, { quantity: v })}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Unit"
            value={ing.unit}
            onChangeText={(v) => updateIngredient(index, { unit: v })}
          />
        </View>
      ))}
      <Pressable onPress={addIngredientRow}>
        <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Add ingredient</Text>
      </Pressable>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save meal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.surface },
  typeChipSelected: { backgroundColor: colors.primary },
  typeChipText: { color: colors.text, textTransform: 'capitalize' },
  typeChipTextSelected: { color: 'white' },
  saveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
