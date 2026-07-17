"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchCohortRoles, createCohortRole, deleteCohortRole } from "@/lib/api/cohorts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface CohortRolesTabProps {
  cohortId: string;
}

export function CohortRolesTab({ cohortId }: CohortRolesTabProps) {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: roles,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["cohort-roles", cohortId],
    queryFn: () => fetchCohortRoles(cohortId),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => deleteCohortRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cohort-roles", cohortId] });
    },
  });

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roleName.trim()) {
      setError("Название роли обязательно");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCohortRole(cohortId, { name: roleName.trim() });
      queryClient.invalidateQueries({ queryKey: ["cohort-roles", cohortId] });
      setRoleName("");
      setShowAddDialog(false);
    } catch {
      setError("Ошибка при создании роли");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (roleId: string) => {
    deleteMutation.mutate(roleId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки ролей когорты
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Роли / Треки</h3>
          <p className="text-sm text-muted-foreground">
            Управление списком ролей (треков) для данной когорты.
            Роли используются при одобрении заявок.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить роль
        </Button>
      </div>

      {!roles || roles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет ролей</CardTitle>
            <CardDescription>
              Добавьте роли для данной когорты, например: Frontend, Backend, Аналитик
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="flex items-center justify-between py-3">
                <span className="font-medium">{role.name}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(role.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить роль</DialogTitle>
            <DialogDescription>
              Введите название новой роли для когорты
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Название роли <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Frontend"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Добавление..." : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}