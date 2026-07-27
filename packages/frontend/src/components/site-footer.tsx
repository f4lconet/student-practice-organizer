import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Колонка 1: логотип + описание */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-lg mb-3">
              <Logo size={28} />
              Практика
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Сервис для организации и сопровождения приёма студентов на практику.
              Всё в одном месте: заявки, документы, задачи и отчёты.
            </p>
          </div>

          {/* Колонка 2: ссылки */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Студентам</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/survey/current" className="hover:text-foreground transition-colors">
                  Подать заявку
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Войти в личный кабинет
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Зарегистрироваться
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: контакты */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Контакты</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:practica@example.com"
                  className="hover:text-foreground transition-colors"
                >
                  practica@example.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя полоса */}
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          &copy; {year} Практика. Все права защищены.
        </div>
      </div>
    </footer>
  );
}