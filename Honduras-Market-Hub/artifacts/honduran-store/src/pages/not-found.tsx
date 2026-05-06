import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-primary/40" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.notFound.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground mb-6">{t.notFound.subtitle}</p>
          <Link href="/">
            <Button className="rounded-full px-8">{t.notFound.back}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
