"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchMyDocuments,
  updateMyDocuments,
  generateDocument,
  uploadReport,
} from "@/lib/api/documents";
import { fetchDashboard } from "@/lib/api/dashboard";
import type { StudentDocumentData } from "@/entities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  Loader2,
  Save,
  CheckCheck,
  XCircle,
} from "lucide-react";

// =====================================================
// Поля формы документов студента
// =====================================================
interface FormField {
  key: keyof StudentDocumentData;
  label: string;
  type: "text" | "textarea";
  placeholder: string;
}

const FORM_FIELDS: FormField[] = [
  { key: "studentFio", label: "ФИО", type: "text", placeholder: "Иванов Иван Иванович" },
  { key: "group", label: "Группа", type: "text", placeholder: "РИ-390001" },
  { key: "directionCode", label: "Код направления", type: "text", placeholder: "09.03.04" },
  { key: "directionName", label: "Направление", type: "text", placeholder: "Программная инженерия" },
  { key: "programName", label: "Наименование программы", type: "text", placeholder: "Разработка и сопровождение ПО" },
  { key: "specialty", label: "Специальность", type: "text", placeholder: "Программист" },
  { key: "practiceTopic", label: "Тема практики", type: "text", placeholder: "Тема практики" },
  { key: "mainStageTasks", label: "Основные этапы работ", type: "textarea", placeholder: "1. ...\n2. ...\n3. ..." },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

// =====================================================
// Компонент загрузки отчёта
// =====================================================
function ReportUploadSection({
  reportFileName,
  isReportApproved,
  onUpload,
  isUploading,
}: {
  reportFileName: string | null;
  isReportApproved: boolean;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".docx") || file.name.endsWith(".pdf"))) {
        onUpload(file);
      } else {
        toast.error("Допустимые форматы: .docx, .pdf");
      }
    },
    [onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload],
  );

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">Отчёт о практике</h4>

      {reportFileName ? (
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{reportFileName}</span>
            {isReportApproved ? (
              <Badge variant="default" className="shrink-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Допущен
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                На проверке
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isReportApproved
              ? "Администратор одобрил отчёт. Титульный лист доступен для формирования."
              : "Отчёт отправлен на проверку администратору."}
          </p>
        </div>
      ) : null}

      {/* Drag&drop зона */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isUploading ? "Загрузка..." : "Перетащите файл сюда или нажмите для выбора"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">.docx или .pdf</p>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.pdf"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}

// =====================================================
// Главный компонент страницы
// =====================================================
export default function CabinetDocumentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Получение cohortId из dashboard
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });
  const application = dashboard?.applications?.[0];
  const applicationId = application?.id ?? "";
  const cohortId = application?.cohortId ?? "";

  // 1. Загрузка данных документов
  const dataQuery = useQuery({
    queryKey: ["documents", "data", applicationId, cohortId],
    queryFn: () => fetchMyDocuments(applicationId, cohortId),
    enabled: !!applicationId && !!cohortId,
  });

  const docData = dataQuery.data;

  // Инициализация формы при загрузке данных
  const initializedRef = useRef(false);
  useEffect(() => {
    if (docData && !initializedRef.current) {
      initializedRef.current = true;
      const initial: Record<string, string> = {};
      for (const field of FORM_FIELDS) {
        initial[field.key] = (docData[field.key] as string) ?? "";
      }
      setFormValues(initial);
    }
  }, [docData]);

  // 2. Готовность ИЗ: все поля формы заполнены
  const izRequiredFields: (keyof StudentDocumentData)[] = [
    "studentFio",
    "group",
    "directionCode",
    "directionName",
    "programName",
    "practiceTopic",
    "mainStageTasks",
  ];

  const areIzFieldsFilled = izRequiredFields.every(
    (key) => (formValues[key] ?? "").trim().length > 0,
  );

  // 3. Мутация сохранения
  const saveMutation = useMutation({
    mutationFn: (data: Partial<StudentDocumentData>) => updateMyDocuments(cohortId, data),
    onSuccess: () => {
      setSaveStatus("saved");
      setDirtyFields(new Set());
    },
    onError: () => {
      setSaveStatus("error");
      toast.error("Ошибка при сохранении данных");
    },
  });

  // 4. Мутация формирования документа
  const generateMutation = useMutation({
    mutationFn: (type: string) =>
      generateDocument(type as "individual-task" | "review" | "title-page", cohortId),
    onSuccess: (data) => {
      toast.success("Документ сформирован!");
      // Скачиваем файл — ответ это Blob
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
    onError: () => {
      toast.error("Ошибка при формировании документа");
    },
    onSettled: () => {
      setGeneratingType(null);
    },
  });

  // 5. Мутация загрузки отчёта
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadReport(cohortId, file),
    onSuccess: () => {
      toast.success("Отчёт загружен!");
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["documents", "data"] });
    },
    onError: () => {
      toast.error("Ошибка при загрузке отчёта");
      setIsUploading(false);
    },
  });

  // ======== Обработчики ========

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [key]: value }));
      setDirtyFields((prev) => new Set(prev).add(key));
      setSaveStatus("idle");

      // Сброс предыдущего таймера автосохранения
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const handleFieldBlur = useCallback(
    (key: string) => {
      if (dirtyFields.has(key)) {
        setSaveStatus("saving");
        saveMutation.mutate({ [key]: formValues[key] ?? "" });
      }
    },
    [dirtyFields, formValues, saveMutation],
  );

  const handleSaveAll = useCallback(() => {
    if (dirtyFields.size === 0) {
      toast.info("Нет изменений для сохранения");
      return;
    }

    setSaveStatus("saving");
    const patch: Record<string, string> = {};
    for (const key of dirtyFields) {
      patch[key] = formValues[key] ?? "";
    }
    saveMutation.mutate(patch);
  }, [dirtyFields, formValues, saveMutation]);

  const handleGenerate = useCallback(
    (type: string) => {
      setGeneratingType(type);
      generateMutation.mutate(type);
    },
    [generateMutation],
  );

  const handleUploadReport = useCallback(
    (file: File) => {
      setIsUploading(true);
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  // ======== Состояния загрузки ========

  if (dataQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (dataQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось загрузить данные документов. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    );
  }

  const applicationApproved = application?.status === "approved";
  const reportFileName = docData?.reportFileUrl ?? null;
  const isReportApproved = docData?.reportAdminApproved ?? false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Документы</h1>
        <p className="text-sm text-muted-foreground">
          Заполните данные для формирования документов
        </p>
      </div>

      {/* ======== Единая форма данных студента ======== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base">Данные студента</CardTitle>
            <CardDescription>
              Единая форма для всех документов — заполните один раз
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Индикатор сохранения */}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Сохранение...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCheck className="h-3 w-3" />
                Сохранено
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3 w-3" />
                Ошибка
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAll}
              disabled={saveStatus === "saving" || dirtyFields.size === 0}
            >
              <Save className="mr-1 h-3 w-3" />
              Сохранить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORM_FIELDS.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <Label htmlFor={field.key} className="mb-1.5 block text-sm font-medium">
                  {field.label}
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    placeholder={field.placeholder}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleFieldBlur(field.key)}
                    className="min-h-[100px] resize-y"
                  />
                ) : (
                  <Input
                    id={field.key}
                    placeholder={field.placeholder}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleFieldBlur(field.key)}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ======== Секция загрузки отчёта ======== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Отчёт о практике</CardTitle>
          <CardDescription>
            Загрузите отчёт в формате .docx или .pdf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportUploadSection
            reportFileName={reportFileName}
            isReportApproved={isReportApproved}
            onUpload={handleUploadReport}
            isUploading={isUploading}
          />
        </CardContent>
      </Card>

      {/* ======== Карточки документов ======== */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ИЗ — Индивидуальное задание */}
        <DocumentCard
          title="Индивидуальное задание"
          description="Формируется на основе данных студента и одобренной заявки"
          icon={<FileText className="h-5 w-5" />}
          isReady={areIzFieldsFilled && applicationApproved}
          readyLabel="Все поля заполнены"
          notReadyLabel={
            !applicationApproved
              ? "Требуется одобренная заявка"
              : "Заполните все поля в форме данных студента"
          }
          isGenerating={generatingType === "individual-task"}
          onGenerate={() => handleGenerate("individual-task")}
        />

        {/* Отзыв */}
        <DocumentCard
          title="Отзыв о практике"
          description="Готовится администратором после проверки"
          icon={<FileText className="h-5 w-5" />}
          isReady={!!(docData?.reviewGrade)}
          readyLabel="Отзыв готов"
          notReadyLabel="Отзыв ещё не написан администратором"
          isGenerating={generatingType === "review"}
          onGenerate={() => handleGenerate("review")}
        />

        {/* Титульный лист */}
        <DocumentCard
          title="Титульный лист отчёта"
          description="Доступен после загрузки отчёта и одобрения администратором"
          icon={<FileText className="h-5 w-5" />}
          isReady={isReportApproved}
          readyLabel="Можно сформировать"
          notReadyLabel={
            reportFileName
              ? "Ожидает одобрения администратором"
              : "Сначала загрузите отчёт"
          }
          isGenerating={generatingType === "title-page"}
          onGenerate={() => handleGenerate("title-page")}
        />
      </div>
    </div>
  );
}

// =====================================================
// Компонент карточки документа
// =====================================================
function DocumentCard({
  title,
  description,
  icon,
  isReady,
  readyLabel,
  notReadyLabel,
  isGenerating,
  onGenerate,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isReady: boolean;
  readyLabel: string;
  notReadyLabel: string;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <Card className={isReady ? "border-green-200" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isReady ? (
          <Badge variant="default" className="w-fit">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {readyLabel}
          </Badge>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{notReadyLabel}</p>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!isReady || isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Формирование...
            </>
          ) : (
            "Сформировать документ"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}