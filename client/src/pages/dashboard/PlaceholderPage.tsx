import React from 'react';
import { Sparkles, Construction } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  nextPart: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, nextPart }) => {
  return (
    <div className="flex flex-col gap-6 items-center justify-center py-12 animate-enter text-center">
      <Card className="max-w-md w-full">
        <CardHeader className="items-center pb-4">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/10 rounded-xl mb-3">
            <Construction className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border mt-4 pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-violet-400 justify-center">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Release</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed px-4">
            This module will be fully built out in <strong className="text-foreground">{nextPart}</strong> of our development plan. Backend routers and db collections are ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
