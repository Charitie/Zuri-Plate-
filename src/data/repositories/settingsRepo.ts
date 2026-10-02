import { getDb } from '../db';
import { UserSettings } from '../types';
import { nowTimestamp } from '@/services/dateService';

export const DEFAULT_SETTINGS: UserSettings = {
  proteinTargetG: 120,
  leftoverLunchEnabled: true,
  planDays: 7,
  varietyPreference: 'balanced',
};

interface SettingsRow {
  protein_target_g: number;
  leftover_lunch_enabled: number;
  plan_days: number;
  variety_preference: string;
  onboarded_at: string | null;
}

export const settingsRepo = {
  async get(): Promise<UserSettings> {
    const db = await getDb();
    const row = await db.getFirstAsync<SettingsRow>(`SELECT * FROM user_settings WHERE id = 1`);
    if (!row) {
      await this.save(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
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

  async hasCompletedOnboarding(): Promise<boolean> {
    const db = await getDb();
    const row = await db.getFirstAsync<Pick<SettingsRow, 'onboarded_at'>>(
      `SELECT onboarded_at FROM user_settings WHERE id = 1`
    );
    return !!row?.onboarded_at;
  },

  /** Saves the onboarding answers and marks onboarding done, in one transaction. */
  async completeOnboarding(settings: UserSettings): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await this.save(settings);
      await db.runAsync(`UPDATE user_settings SET onboarded_at = ? WHERE id = 1`, [nowTimestamp()]);
    });
  },
};
