import { SupabaseClient } from '@supabase/supabase-js';

export interface PendingSave {
  key: string;
  data: any;
  timestamp: number;
}

export function queueSave(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const queue: PendingSave[] = JSON.parse(localStorage.getItem('pending_saves') || '[]');
    // Dedup: if key already exists, overwrite with newer data
    const filtered = queue.filter(item => item.key !== key);
    filtered.push({ key, data, timestamp: Date.now() });
    localStorage.setItem('pending_saves', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to queue offline save:', e);
  }
}

export async function drainQueue(supabase: SupabaseClient) {
  if (typeof window === 'undefined') return;
  try {
    const queue: PendingSave[] = JSON.parse(localStorage.getItem('pending_saves') || '[]');
    if (!queue.length) return;

    const remaining: PendingSave[] = [];

    for (const item of queue) {
      try {
        await retrySave(supabase, item);
      } catch (err) {
        console.error(`Failed to retry save for key: ${item.key}`, err);
        // Keep in queue if it failed again
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem('pending_saves', JSON.stringify(remaining));
    } else {
      localStorage.removeItem('pending_saves');
    }
  } catch (e) {
    console.error('Failed to drain offline queue:', e);
  }
}

async function retrySave(supabase: SupabaseClient, item: PendingSave) {
  if (item.key === 'diary') {
    const { dayNumber, userId, diaryText } = item.data;
    const res = await fetch('/api/save-diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayNumber, userId, diaryText })
    });
    if (!res.ok) {
      throw new Error(`Failed to save diary via API: ${res.statusText}`);
    }
  } else if (item.key.startsWith('text-field-')) {
    const { fieldName, value, dayNum, userId } = item.data;
    const words = fieldName === 'diary_text' ? value.trim().split(/\s+/).filter(Boolean).length : undefined;
    
    const updatePayload: any = {
      user_id: userId,
      day_number: dayNum,
      [fieldName]: value,
      updated_at: new Date().toISOString()
    };
    if (words !== undefined) {
      updatePayload.diary_word_count = words;
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      throw new Error(`Failed to save text field: ${error.message}`);
    }
  } else if (item.key.startsWith('toggle-')) {
    const { columnName, isChecked, dayNum, userId, completedAt } = item.data;
    const updatePayload: any = {
      user_id: userId,
      day_number: dayNum,
      [columnName]: isChecked,
      updated_at: new Date().toISOString()
    };
    if (completedAt) {
      updatePayload.completed_at = completedAt;
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      throw new Error(`Failed to save toggle: ${error.message}`);
    }
  }
}
