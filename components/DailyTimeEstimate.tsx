'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Video, PenTool, Mic, BookText, Music } from 'lucide-react';

interface DailyTimeEstimateProps {
  dailyMinutes: number;
}

export default function DailyTimeEstimate({ dailyMinutes }: DailyTimeEstimateProps) {
  // Breakdowns based on minutes selected
  const getPlanDetails = () => {
    switch (dailyMinutes) {
      case 30:
        return {
          total: '~30 min today',
          desc: 'Minimum viable study mode: Focus on the 3 core retention modules. Others are optional.',
          breakdown: [
            { label: 'Vocab', time: '10m', required: true, icon: BookOpen },
            { label: 'Listening', time: '10m', required: true, icon: Video },
            { label: 'Writing', time: '10m (80w target)', required: true, icon: PenTool },
            { label: 'Grammar', time: 'Skip / Optional', required: false, icon: BookText },
            { label: 'Song', time: 'Skip / Optional', required: false, icon: Music },
            { label: 'Speaking', time: 'Skip / Optional', required: false, icon: Mic }
          ]
        };
      case 60:
        return {
          total: '~60 min today',
          desc: 'Balanced light mode: Shorter session tasks (100w diary target). Complete all standard items.',
          breakdown: [
            { label: 'Vocab', time: '10m', required: true, icon: BookOpen },
            { label: 'Grammar', time: '15m', required: true, icon: BookText },
            { label: 'Song', time: '10m', required: true, icon: Music },
            { label: 'Listening', time: '10m', required: true, icon: Video },
            { label: 'Writing', time: '10m (100w target)', required: true, icon: PenTool },
            { label: 'Speaking', time: '5m', required: true, icon: Mic }
          ]
        };
      case 120:
        return {
          total: '~120 min today',
          desc: 'Full immersion mode: Complete all standard elements, daily bonus challenges, and one reading passage.',
          breakdown: [
            { label: 'Vocab', time: '20m', required: true, icon: BookOpen },
            { label: 'Grammar', time: '25m', required: true, icon: BookText },
            { label: 'Song', time: '20m', required: true, icon: Music },
            { label: 'Listening', time: '20m', required: true, icon: Video },
            { label: 'Writing', time: '20m (150w target)', required: true, icon: PenTool },
            { label: 'Speaking', time: '15m', required: true, icon: Mic }
          ]
        };
      case 90:
      default:
        return {
          total: '~90 min today',
          desc: 'Standard curriculum mode: Recommended full daily learning schedule.',
          breakdown: [
            { label: 'Vocab', time: '15m', required: true, icon: BookOpen },
            { label: 'Grammar', time: '20m', required: true, icon: BookText },
            { label: 'Song', time: '15m', required: true, icon: Music },
            { label: 'Listening', time: '15m', required: true, icon: Video },
            { label: 'Writing', time: '15m (150w target)', required: true, icon: PenTool },
            { label: 'Speaking', time: '10m', required: true, icon: Mic }
          ]
        };
    }
  };

  const plan = getPlanDetails();

  return (
    <Card className="border border-border/80 bg-card rounded-2xl p-4 select-none">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sakura/10 text-sakura shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-black text-sm text-ink">{plan.total}</span>
            <span className="text-[10px] text-ink-muted leading-relaxed font-medium">
              {plan.desc}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
          {plan.breakdown.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1 ${
                  item.required
                    ? 'border-border bg-bg/20'
                    : 'border-dashed border-border/60 bg-bg/5 opacity-55'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.required ? 'text-sakura' : 'text-ink-muted'}`} />
                <span className="text-[9px] font-bold text-ink leading-none">{item.label}</span>
                <Badge
                  variant="outline"
                  className={`text-[8px] py-0 px-1 border-none font-semibold leading-none ${
                    item.required ? 'bg-sakura/10 text-sakura-deep' : 'bg-bg text-ink-muted'
                  }`}
                >
                  {item.time}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
