import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StubPageProps {
  title: string;
  day: number;
  dayTitle: string;
}

export function StubPage({ title, day, dayTitle }: StubPageProps) {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            TODO: реализовать в{" "}
            <Link
              href="/"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              День {day}
            </Link>{" "}
            — {dayTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Страница-заглушка. См. раздел «День {day}» в{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              .cursor/rules/План_разработки_фронтенда.md
            </code>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
