"use client";

import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyBuilderTab } from "@/features/admin-cohorts/survey-builder-tab";
import { CohortRolesTab } from "@/features/admin-cohorts/cohort-roles-tab";
import { TestTaskTab } from "@/features/admin-cohorts/test-task-tab";

export default function AdminCohortSettingsPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки когорты</h1>
        <p className="text-muted-foreground">
          Управление анкетой, ролями и тестовым заданием
        </p>
      </div>

      <Tabs defaultValue="survey" className="space-y-4">
        <TabsList>
          <TabsTrigger value="survey">Анкета</TabsTrigger>
          <TabsTrigger value="roles">Роли / Треки</TabsTrigger>
          <TabsTrigger value="test-task">Тестовое задание</TabsTrigger>
        </TabsList>

        <TabsContent value="survey" className="space-y-4">
          <SurveyBuilderTab cohortId={cohortId} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <CohortRolesTab cohortId={cohortId} />
        </TabsContent>

        <TabsContent value="test-task" className="space-y-4">
          <TestTaskTab cohortId={cohortId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}