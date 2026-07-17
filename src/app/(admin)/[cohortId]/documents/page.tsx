"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchAdminDocumentsOverview,
  saveAdminReview,
  approveReport,
  type AdminStudentDocumentInfo,
} from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Готов
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      Не готов
    </Badge>
  );
}

// ---- Review Dialog ----
function ReviewDialog({
  student,
  cohortId,
  open,
  onOpenChange,
}: {
  student: AdminStudentDocumentInfo | null;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    reviewActivities: "",
    reviewCharacteristic: "",
    reviewEmployed: "",
    reviewNextPractice: "",
    reviewEmploymentOffer: "",
    reviewSuggestions: "",
    reviewGrade: "",
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      saveAdminReview(student!.userId, cohortId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-students", cohortId],
      });
      toast.success("Отзыв сохранён");
    },
    onError: () => {
      toast.error("Ошибка при сохранении отзыва");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isAllFilled = Object.values(formData).every(
    (v) => v !== null && v !== undefined && v !== "",
  );

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отзыв о практике</DialogTitle>
          <DialogDescription>
            {student.userName} — заполните все поля для формирования документа
            «Отзыв»
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="reviewActivities">
              Виды и объём работ, выполненных студентом
            </Label>
            <Textarea
              id="reviewActivities"
              value={formData.reviewActivities}
              onChange={(e) => updateField("reviewActivities", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewCharacteristic">
              Характеристика работы студента
            </Label>
            <Textarea
              id="reviewCharacteristic"
              value={formData.reviewCharacteristic}
              onChange={(e) => updateField("reviewCharacteristic", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Трудоустройство</Label>
            <Select
              value={formData.reviewEmployed}
              onValueChange={(v) => { if (v) updateField("reviewEmployed", v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Рекомендован к трудоустройству">Да — рекомендую</SelectItem>
                <SelectItem value="Не рекомендован">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewNextPractice">
              Рекомендации по следующей практике
            </Label>
            <Textarea
              id="reviewNextPractice"
              value={formData.reviewNextPractice}
              onChange={(e) => updateField("reviewNextPractice", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Предложение о работе</Label>
            <Select
              value={formData.reviewEmploymentOffer}
              onValueChange={(v) => { if (v) updateField("reviewEmploymentOffer", v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Предложена позиция">Да</SelectItem>
                <SelectItem value="Не предложена">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewSuggestions">
              Замечания и предложения
            </Label>
            <Textarea
              id="reviewSuggestions"
              value={formData.reviewSuggestions}
              onChange={(e) => updateField("reviewSuggestions", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewGrade">Оценка</Label>
            <Select
              value={formData.reviewGrade}
              onValueChange={(v) => { if (v) updateField("reviewGrade", v); }}
            >
              <SelectTrigger id="reviewGrade" className="w-32">
                <SelectValue placeholder="Оценка" />
              </SelectTrigger>
              <SelectContent>
                {["Отлично", "Хорошо", "Удовлетворительно"].map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAllFilled && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Все поля отзыва заполнены. Студент сможет сформировать
                документ «Отзыв».
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !isAllFilled}
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Report Dialog ----
function ReportDialog({
  student,
  cohortId,
  open,
  onOpenChange,
}: {
  student: AdminStudentDocumentInfo | null;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [approved, setApproved] = useState(student?.reportStatus === "approved");
  const [downloading, setDownloading] = useState(false);

  // Синхронизация при открытии диалога для другого студента
  if (student && approved !== (student.reportStatus === "approved")) {
    setApproved(student.reportStatus === "approved");
  }

  const approveMutation = useMutation({
    mutationFn: (value: boolean) =>
      approveReport(student!.userId, cohortId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students", cohortId] });
      toast.success("Статус обновлён");
    },
    onError: () => {
      toast.error("Ошибка при обновлении статуса");
    },
  });

  const handleToggleApproval = (value: boolean) => {
    setApproved(value);
    approveMutation.mutate(value);
  };

  const handleDownload = async () => {
    if (!student?.reportFileUrl || downloading) return;
    setDownloading(true);
    try {
      const fileName = student.reportFileUrl.replace(/^.*[/\\]/, "").replace(/^\//, "");
      const { getAccessToken } = await import("@/lib/api/token-strategy");
      const token = getAccessToken();
      const res = await fetch(`/api/uploads/${fileName}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "report.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Не удалось загрузить файл отчёта");
    } finally {
      setDownloading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отчёт о практике</DialogTitle>
          <DialogDescription>{student.userName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Файл отчёта</Label>
            {student.reportFileUrl ? (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {downloading ? "Скачивание..." : "Скачать отчёт"}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Студент ещё не загрузил отчёт
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Допуск к скачиванию титульного листа</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={approved}
                onCheckedChange={handleToggleApproval}
                disabled={approveMutation.isPending}
              />
              <span className="text-sm">
                {approved ? "Допущен" : "Не допущен"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Включите, чтобы студент мог скачать титульный лист отчёта
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDocumentsPage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params.cohortId;

  const [reviewStudent, setReviewStudent] = useState<AdminStudentDocumentInfo | null>(null);
  const [reportStudent, setReportStudent] = useState<AdminStudentDocumentInfo | null>(null);

  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-students", cohortId],
    queryFn: () => fetchAdminDocumentsOverview(cohortId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ошибка загрузки данных практикантов
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Документы</h1>
        <p className="text-muted-foreground">
          Управление документами практикантов когорты
        </p>
      </div>

      {!students || students.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет практикантов</CardTitle>
            <CardDescription>
              В данной когорте нет практикантов с одобренными заявками
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО практиканта</TableHead>
                <TableHead className="text-center">ИЗ</TableHead>
                <TableHead className="text-center">Отзыв</TableHead>
                <TableHead className="text-center">Титульный лист</TableHead>
                <TableHead className="text-center">Отчёт</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.userId}>
                  <TableCell className="font-medium">
                    {student.userName || student.userEmail || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge ready={student.individualTaskReady} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge ready={student.reviewReady} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge ready={!!(student.reportUploaded && student.reportStatus === "approved")} />
                  </TableCell>
                  <TableCell className="text-center">
                    {student.reportUploaded ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {student.reportStatus === "approved" ? "Одобрен" : "Загружен"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Нет
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewStudent(student)}
                      >
                        Отзыв
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportStudent(student)}
                      >
                        Отчёт
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {reviewStudent !== null && (
        <ReviewDialog
          key={reviewStudent.userId}
          student={reviewStudent}
          cohortId={cohortId}
          open={true}
          onOpenChange={(open) => { if (!open) setReviewStudent(null); }}
        />
      )}

      {reportStudent !== null && (
        <ReportDialog
          key={reportStudent.userId}
          student={reportStudent}
          cohortId={cohortId}
          open={true}
          onOpenChange={(open) => { if (!open) setReportStudent(null); }}
        />
      )}
    </div>
  );
}