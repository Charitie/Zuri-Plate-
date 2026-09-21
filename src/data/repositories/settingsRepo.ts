import { getDb } from '../db';
import { UserSettings } from '../types';

const DEFAULTS: UserSettings = {
  proteinTargetG: 120,
  leftoverLunchEnabled: true,
  planDays: 7,
  varietyPreference: 'balanced',
};

export const settingsRepo = {
  async get(): Promise<UserSettings> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(`SELECT * FROM user_settings WHERE id = 1`);
    if (!row) {
      await this.save(DEFAULTS);
      return DEFAULTS;
    }
    return {
      proteinTargetG: row.protein_target_g,
      leftoverLunchEnabled: !!row.leftover_lunch_enabled,
      planDays: row.plan_days,
      varietyPreference: row.variety_preference,
    };
  },

  async save(settings: UserSettings): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO user_settings (id, protein_target_g, leftover_lunch_enabled, plan_days, variety_preference)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         protein_target_g = excluded.protein_target_g,
         leftover_lunch_enabled = excluded.leftover_lunch_enabled,
         plan_days = excluded.plan_days,
         variety_preference = excluded.variety_preference`,
      [settings.proteinTargetG, settings.leftoverLunchEnabled ? 1 : 0, settings.planDays, settings.varietyPreference]
    );
  },
};
