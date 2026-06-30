import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

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
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E] flex items-center gap-2">
          <AlertCircle className="w-7 h-7 text-amber-700/80" />
          My Mistake Ledger
        </h1>
        <p className="text-sm text-[#73706B]">
          A personal list of recurring mistakes flagged by your teacher. Review these to build accuracy!
        </p>
      </div>

      {/* List card */}
      <div className="space-y-4">
        {(!mistakes || mistakes.length === 0) ? (
          <Card className="border border-[#E8E2D9] bg-white rounded-xl">
            <CardContent className="p-8 text-center text-sm text-[#73706B]/50 italic">
              No mistakes logged yet. Keep writing cleanly and practicing!
            </CardContent>
          </Card>
        ) : (
          mistakes.map((item) => (
            <Card key={item.id} className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-200 bg-amber-50/20 text-amber-800 font-mono">
                    Flagged Entry
                  </Badge>
                  {item.day_number && (
                    <span className="text-xs font-semibold text-[#73706B]/60">
                      Day {item.day_number} Submission
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Mistake side */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                      Common Slip-up:
                    </span>
                    <div className="p-3 bg-red-50/20 border border-red-100/50 rounded-lg text-sm text-[#33312E] line-through font-mono">
                      {item.mistake}
                    </div>
                  </div>

                  {/* Correction side */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#5B7F6B] uppercase tracking-wider block">
                      Correct Usage:
                    </span>
                    <div className="p-3 bg-[#5B7F6B]/5 border border-[#5B7F6B]/20 rounded-lg text-sm text-[#5B7F6B] font-semibold font-mono flex items-center justify-between">
                      <span>{item.correction}</span>
                      <CheckIcon />
                    </div>
                  </div>
                </div>

                <span className="text-[9px] text-[#73706B]/40 block text-right">
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
    <span className="w-4 h-4 rounded-full bg-[#5B7F6B] text-white text-[8px] flex items-center justify-center font-bold">
      ✓
    </span>
  );
}
