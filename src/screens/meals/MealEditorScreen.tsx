import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { PhotoPicker } from '@/components/PhotoPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UnitPicker } from '@/components/UnitPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { useMealsStore } from '@/store/useMealsStore';
import { mealsRepo } from '@/data/repositories/mealsRepo';
import { MealType, ShoppingCategory } from '@/data/types';
import { categorize } from '@/domain/shoppingAggregator';
import { MealScreensParamList } from '@/app/navigationTypes';
import { reportError } from '@/services/errors';

type Props = NativeStackScreenProps<MealScreensParamList, 'MealEditor'>;

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
  /** null = auto (guessed from the name when the shopping list is built). */
  category: ShoppingCategory | null;
}

const emptyIngredient = (): IngredientDraft => ({ name: '', quantity: '', unit: 'g', category: null });

export function MealEditorScreen({ route, navigation }: Props) {
  const mealId = route.params?.mealId;
  const addMeal = useMealsStore((s) => s.addMeal);
  const updateMeal = useMealsStore((s) => s.updateMeal);

  const [name, setName] = useState('');
  const [type, setType] = useState<MealType>('dinner');
  const [proteinG, setProteinG] = useState('0');
  const [servings, setServings] = useState('1');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mealId) return;
    let cancelled = false;
    (async () => {
      try {
        const [meal, existingIngredients] = await Promise.all([
          mealsRepo.getById(mealId),
          mealsRepo.getIngredients(mealId),
        ]);
        if (!meal || cancelled) return;
        setName(meal.name);
        setType(meal.type);
        setProteinG(String(meal.proteinG));
        setServings(String(meal.servings));
        setPhotoUri(meal.photoUri);
        setIngredients(
          existingIngredients.map((i) => ({
            name: i.name,
            quantity: String(i.quantity),
            unit: i.unit,
            category: i.category,
          }))
        );
      } catch (e) {
        if (!cancelled) reportError(e, "Couldn't load this meal.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mealId]);

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };

  const addIngredientRow = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    const cleanIngredients = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: Number(i.quantity) || 0,
        unit: i.unit.trim() || 'unit',
        category: i.category,
      }));

    const input = {
      name: name.trim(),
      type,
      proteinG: Math.max(0, Number(proteinG) || 0),
      servings: Math.max(1, Math.round(Number(servings)) || 1),
      photoUri,
      ingredients: cleanIngredients,
    };

    setSaving(true);
    try {
      if (mealId) {
        await updateMeal(mealId, input);
      } else {
        await addMeal(input);
      }
      navigation.goBack();
    } catch (e) {
      reportError(e, "Couldn't save this meal.");
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
      <Text style={typography.h1} accessibilityRole="header">
        {mealId ? 'Edit Meal' : 'New Meal'}
      </Text>

      <PhotoPicker photoUri={photoUri} onChange={setPhotoUri} />

      <View style={styles.field}>
        <Text style={styles.label} importantForAccessibility="no">
          Meal name
        </Text>
        <TextInput
          style={[styles.input, nameError && styles.inputError]}
          placeholder="e.g. Chicken stir-fry"
          accessibilityLabel="Meal name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (v.trim()) setNameError(false);
          }}
        />
        {nameError && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            Give the meal a name.
          </Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label} importantForAccessibility="no">
          Meal type
        </Text>
        <View style={styles.typeRow} accessibilityRole="radiogroup" accessibilityLabel="Meal type">
          {MEAL_TYPES.map((t) => (
            <Pressable
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipSelected]}
              onPress={() => setType(t)}
              accessibilityRole="radio"
              accessibilityState={{ checked: type === t }}
              accessibilityLabel={t}
            >
              <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label} importantForAccessibility="no">
            Total protein (g)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 60"
            accessibilityLabel="Total protein for the whole recipe, in grams"
            keyboardType="numeric"
            value={proteinG}
            onChangeText={setProteinG}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label} importantForAccessibility="no">
            Makes (servings)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2"
            accessibilityLabel="Number of servings the recipe makes"
            keyboardType="numeric"
            value={servings}
            onChangeText={setServings}
          />
        </View>
      </View>

      <Text style={typography.bodyBold}>Ingredients</Text>
      <View style={[styles.row, { marginTop: -8 }]} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.label, { flex: 2 }]}>Name</Text>
        <Text style={[styles.label, { flex: 1 }]}>Qty</Text>
        <Text style={[styles.label, { flex: 1 }]}>Unit</Text>
      </View>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.ingredient}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="e.g. Chicken"
              accessibilityLabel={`Ingredient ${index + 1} name`}
              value={ing.name}
              onChangeText={(v) => updateIngredient(index, { name: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="200"
              accessibilityLabel={`Ingredient ${index + 1} quantity`}
              keyboardType="numeric"
              value={ing.quantity}
              onChangeText={(v) => updateIngredient(index, { quantity: v })}
            />
            <UnitPicker
              style={{ flex: 1 }}
              accessibilityLabel={`Ingredient ${index + 1} unit`}
              value={ing.unit}
              onChange={(v) => updateIngredient(index, { unit: v })}
            />
          </View>
          <CategoryPicker
            value={ing.category}
            suggested={categorize(ing.name)}
            onChange={(category) => updateIngredient(index, { category })}
            accessibilityLabel={`Ingredient ${index + 1} shopping category`}
          />
        </View>
      ))}
      <Pressable onPress={addIngredientRow} accessibilityRole="button">
        <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Add ingredient</Text>
      </Pressable>

      <PrimaryButton title="Save meal" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger },
  field: { gap: 6 },
  label: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  ingredient: { gap: 6, marginTop: -8, marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.surface },
  typeChipSelected: { backgroundColor: colors.primary },
  typeChipText: { color: colors.text, textTransform: 'capitalize' },
  typeChipTextSelected: { color: 'white' },
});
