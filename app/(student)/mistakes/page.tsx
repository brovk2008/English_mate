import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MistakesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student mistake log
  const { data: mistakes } = await supabase
    .from('mistake_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-700/80 dark:text-amber-500/80" />
          My Mistake Ledger
        </h1>
        <p className="text-sm text-ink-muted mt-0.5">
          A personal list of recurring mistakes flagged by your teacher. Review these to build accuracy!
        </p>
      </div>

      {/* List card */}
      <div className="space-y-4">
        {(!mistakes || mistakes.length === 0) ? (
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-8 text-center text-sm text-ink-muted/50 italic">
              No mistakes logged yet. Keep writing cleanly and practicing!
            </CardContent>
          </Card>
        ) : (
          mistakes.map((item) => (
            <Card key={item.id} className="border border-border bg-card rounded-2xl shadow-sm transition-all hover:scale-[1.01]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-500 font-mono">
                    Flagged Entry
                  </Badge>
                  {item.day_number && (
                    <span className="text-xs font-bold text-ink-muted">
                      Day {item.day_number} Submission
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Mistake side */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block">
                      Common Slip-up:
                    </span>
                    <div className="p-3 bg-sakura/5 border border-sakura/20 rounded-xl text-sm text-ink-muted line-through font-mono">
                      {item.mistake}
                    </div>
                  </div>

                  {/* Correction side */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-matcha uppercase tracking-wider block">
                      Correct Usage:
                    </span>
                    <div className="p-3 bg-matcha/5 border border-matcha/20 rounded-xl text-sm text-matcha font-bold font-mono flex items-center justify-between">
                      <span>{item.correction}</span>
                      <CheckIcon />
                    </div>
                  </div>
                </div>

                <span className="text-[9px] text-ink-muted/40 block text-right font-medium">
                  Logged on {new Date(item.created_at).toLocaleDateString()}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-matcha text-white text-[8px] flex items-center justify-center font-bold">
      ✓
    </span>
  );
}
