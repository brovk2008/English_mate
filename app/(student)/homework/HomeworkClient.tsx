'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';

interface HomeworkClientProps {
  profile: any;
  initialHomeworks: any[];
}

export default function HomeworkClient({ profile, initialHomeworks }: HomeworkClientProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [homeworks, setHomeworks] = useState<any[]>(initialHomeworks);

  const handleToggleItem = async (hwId: string, itemId: string, isChecked: boolean) => {
    // 1. Optimistically update local UI state
    setHomeworks(prev => prev.map(hw => {
      if (hw.id !== hwId) return hw;
      
      let completions = [...(hw.homework_completion || [])];
      if (isChecked) {
        // Add completion
        if (!completions.some(c => c.item_id === itemId)) {
          completions.push({
            homework_id: hwId,
            user_id: profile.id,
            item_id: itemId,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      } else {
        // Remove completion
        completions = completions.filter(c => c.item_id !== itemId);
      }
      
      return {
        ...hw,
        homework_completion: completions
      };
    }));

    // 2. Perform DB operations
    try {
      if (isChecked) {
        await supabase
          .from('homework_completion')
          .upsert({
            homework_id: hwId,
            user_id: profile.id,
            item_id: itemId,
            completed: true,
            completed_at: new Date().toISOString()
          }, { onConflict: 'homework_id,user_id,item_id' });
      } else {
        await supabase
          .from('homework_completion')
          .delete()
          .eq('homework_id', hwId)
          .eq('user_id', profile.id)
          .eq('item_id', itemId);
      }
    } catch (err) {
      console.error("Failed to sync homework completion state:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-2 sm:p-4 select-none">
      {/* Title Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-sakura" />
          My Assigned Homework
        </h1>
        <p className="text-xs text-ink-muted mt-1 font-medium leading-relaxed">
          Complete checklist missions assigned by your teacher. Progress is shared in real time.
        </p>
      </div>

      {/* Homework List Grid */}
      <div className="space-y-4">
        {homeworks.length === 0 ? (
          <Card className="border border-border border-dashed bg-card rounded-2xl p-12 text-center select-none">
            <CheckCircle2 className="w-10 h-10 text-matcha/40 mx-auto mb-3 animate-pulse" />
            <h3 className="font-bold text-sm text-ink font-heading">No homework assigned!</h3>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              You are completely caught up. Keep checking back for assignments from your teacher!
            </p>
          </Card>
        ) : (
          homeworks.map(hw => {
            const totalItems = hw.homework_items?.length || 0;
            const completedItems = hw.homework_completion?.filter((c: any) => c.completed).length || 0;
            const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const isCompleted = progressPct === 100 && totalItems > 0;

            return (
              <Card key={hw.id} className={`border bg-card rounded-2xl p-5 space-y-4 hover:shadow-xs transition-shadow ${
                isCompleted ? 'border-matcha/30 bg-matcha/5' : 'border-border'
              }`}>
                {/* Header title */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-lg text-ink">
                      {hw.title}
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {hw.description}
                    </p>
                  </div>
                  {hw.due_date && (
                    <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                      <Calendar size={10} />
                      Due: {new Date(hw.due_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {/* Progress bar */}
                {totalItems > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-ink-muted">
                      <span>Checklist progress</span>
                      <span>{completedItems} / {totalItems} completed ({progressPct}%)</span>
                    </div>
                    <Progress value={progressPct} className="h-2 bg-bg dark:bg-card border border-border" />
                  </div>
                )}

                {/* Items checklist */}
                <div className="bg-bg/30 dark:bg-card/25 border border-border/40 rounded-xl p-3.5 space-y-2.5">
                  <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Mission Tasks</div>
                  <div className="space-y-2">
                    {hw.homework_items?.map((item: any) => {
                      const completed = hw.homework_completion?.some((c: any) => c.item_id === item.id && c.completed);
                      
                      return (
                        <div key={item.id} className="flex items-start gap-3">
                          <Checkbox
                            id={item.id}
                            checked={completed}
                            onCheckedChange={(checked) => handleToggleItem(hw.id, item.id, !!checked)}
                            className="w-4.5 h-4.5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-md cursor-pointer mt-0.5"
                          />
                          <label
                            htmlFor={item.id}
                            className={`text-xs font-semibold leading-relaxed cursor-pointer transition-colors ${
                              completed ? 'text-ink-muted/50 line-through' : 'text-ink hover:text-sakura'
                            }`}
                          >
                            {item.item_text}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
