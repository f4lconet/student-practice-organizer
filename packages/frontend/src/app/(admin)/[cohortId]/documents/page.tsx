"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchAdminDocumentsOverview,
  saveAdminReview,
  approveReport,
  rejectReport,
  type AdminStudentDocumentInfo,
} from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ThumbsUp,
  ThumbsDown,
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
    reviewEmployedPosition: "",
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

  const isAllFilled = (() => {
    const requiredFields = Object.keys(formData).filter((key) => key !== "reviewEmployedPosition");
    const allRegularFilled = requiredFields.every(
      (key) => formData[key as keyof typeof formData] !== null && formData[key as keyof typeof formData] !== undefined && formData[key as keyof typeof formData] !== "",
    );
    // Если трудоустроен, то поле должности обязательно
    if (formData.reviewEmployed === "Да") {
      return allRegularFilled && formData.reviewEmployedPosition !== "";
    }
    return allRegularFilled;
  })();

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
              Студент осуществил следующие мероприятия:
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
              Краткая характеристика уровня подготовки и отношения практиканта к работе
            </Label>
            <Textarea
              id="reviewCharacteristic"
              value={formData.reviewCharacteristic}
              onChange={(e) => updateField("reviewCharacteristic", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Студент на время практики был трудоустроен?</Label>
            <Select
              value={formData.reviewEmployed}
              onValueChange={(v) => { if (v) updateField("reviewEmployed", v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Да">Да</SelectItem>
                <SelectItem value="Нет">Нет</SelectItem>
              </SelectContent>
            </Select>
            {formData.reviewEmployed === "Да" && (
              <div className="mt-2">
                <Label htmlFor="reviewEmployedPosition">Должность</Label>
                <Input
                  id="reviewEmployedPosition"
                  placeholder="Укажите должность..."
                  value={formData.reviewEmployedPosition || ""}
                  onChange={(e) => updateField("reviewEmployedPosition", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewNextPractice">
              Студенту предложено пройти следующую практику на предприятии (в организации)?
            </Label>
            <Select
              value={formData.reviewNextPractice}
              onValueChange={(v) => { if (v) updateField("reviewNextPractice", v); }}
            >
              <SelectTrigger id="reviewNextPractice">
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Да">Да</SelectItem>
                <SelectItem value="Нет">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Студенту предложено трудоустройство после завершения обучения?</Label>
            <Select
              value={formData.reviewEmploymentOffer}
              onValueChange={(v) => { if (v) updateField("reviewEmploymentOffer", v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Да">Да</SelectItem>
                <SelectItem value="Нет">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewSuggestions">
              Предложения и замечания от организации по теоретической и практической подготовке студентов (В свободной форме)
            </Label>
            <Textarea
              id="reviewSuggestions"
              value={formData.reviewSuggestions}
              onChange={(e) => updateField("reviewSuggestions", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reviewGrade">Оценка за практику (по 10-балльной шкале)</Label>
            <Select
              value={formData.reviewGrade}
              onValueChange={(v) => { if (v) updateField("reviewGrade", v); }}
            >
              <SelectTrigger id="reviewGrade" className="w-32">
                <SelectValue placeholder="Оценка" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((grade) => (
                  <SelectItem key={grade} value={String(grade)}>
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
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [downloading, setDownloading] = useState(false);

  const approveMutation = useMutation({
    mutationFn: ({ comment }: { comment: string }) =>
      approveReport(student!.userId, cohortId, comment || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students", cohortId] });
      toast.success("Отчёт принят");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Ошибка при принятии отчёта");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ comment }: { comment: string }) =>
      rejectReport(student!.userId, cohortId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students", cohortId] });
      toast.success("Отчёт отклонён");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Ошибка при отклонении отчёта");
    },
  });

  const handleDownload = async () => {
    if (!student?.reportFileUrl || downloading) return;
    setDownloading(true);
    try {
      let fileName = student.reportFileUrl.replace(/^.*[/\\]/, "").replace(/^\//, "");
      const { getAccessToken } = await import("@/lib/api/token-strategy");
      const token = getAccessToken();
      const res = await fetch(`/uploads/${fileName}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      // Если в имени нет расширения — определяем из Content-Type
      if (!fileName.includes(".")) {
        const contentType = res.headers.get("content-type") || blob.type;
        const extMap: Record<string, string> = {
          "application/pdf": ".pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
          "application/msword": ".doc",
          "application/vnd.ms-excel": ".xls",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
          "image/png": ".png",
          "image/jpeg": ".jpg",
          "text/plain": ".txt",
        };
        fileName += extMap[contentType] || "";
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "report";
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

      const status = student.reportStatus;
      const isPending = (status === "pending" || status === "revised" || status === "draft");
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отчёт о практике</DialogTitle>
          <DialogDescription>{student.userName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Файл отчёта */}
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

          {/* Статус */}
          <div className="space-y-2">
            <Label>Статус отчёта</Label>
            <div>
              {isApproved ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Принят
                </Badge>
              ) : isRejected ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Отклонён
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  На проверке
                </Badge>
              )}
            </div>
          </div>

          {/* Комментарий (если есть) */}
          {student.reportComment && (
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <p className="text-sm rounded-lg bg-muted p-3">
                {student.reportComment}
              </p>
            </div>
          )}

          {/* Действия: принять / отклонить */}
          {isPending && student.reportFileUrl && (
            <div className="space-y-4 border-t pt-4">
              {action === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="approveComment">
                    Комментарий (необязательно)
                  </Label>
                  <Textarea
                    id="approveComment"
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    placeholder="Дополнительная информация для студента..."
                    rows={2}
                  />
                </div>
              )}

              {action === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejectComment">
                    Причина отклонения <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="rejectComment"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Укажите, что нужно исправить..."
                    rows={3}
                  />
                </div>
              )}

              {!action && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1 gap-1"
                    onClick={() => setAction("approve")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Принять
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-1"
                    onClick={() => setAction("reject")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Отклонить
                  </Button>
                </div>
              )}

              {action === "approve" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAction(null);
                      setApproveComment("");
                    }}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 gap-1"
                    onClick={() => approveMutation.mutate({ comment: approveComment })}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? "Сохранение..." : "Подтвердить"}
                  </Button>
                </div>
              )}

              {action === "reject" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAction(null);
                      setRejectComment("");
                    }}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-1"
                    onClick={() => rejectMutation.mutate({ comment: rejectComment })}
                    disabled={rejectMutation.isPending || !rejectComment.trim()}
                  >
                    {rejectMutation.isPending ? "Сохранение..." : "Отклонить"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Для одобренных — сообщение, что титульный лист доступен студенту */}
          {isApproved && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Отчёт принят. Студент может скачать титульный лист отчёта.
              </AlertDescription>
            </Alert>
          )}
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
                      <Badge variant={student.reportStatus === "approved" ? "default" : student.reportStatus === "rejected" ? "destructive" : "secondary"} className="gap-1">
                        {student.reportStatus === "approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : student.reportStatus === "rejected" ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {student.reportStatus === "approved" ? "Принят" : student.reportStatus === "rejected" ? "Отклонён" : "На проверке"}
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