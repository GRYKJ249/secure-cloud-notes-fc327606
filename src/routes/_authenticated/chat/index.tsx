import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, AudioLines, Image, Lightbulb, Mic, Paperclip, SlidersHorizontal, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { OperaLogoMark } from "@/components/brand/OperaLogoMark";
import { createThread } from "@/lib/local-db";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const PENDING_KEY = "opera-pending-message";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "New conversation — Opera AI" },
      { name: "description", content: "Start a saved conversation with the Opera AI assistant." },
      { property: "og:title", content: "New conversation — Opera AI" },
      { property: "og:description", content: "Start a saved conversation with the Opera AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const start = (text: string) => {
    const message = text.trim();
    if (!message || busy) return;

    if (typeof window !== "undefined") sessionStorage.setItem(PENDING_KEY, message);

    setBusy(true);
    const title = message.slice(0, 48) + (message.length > 48 ? "…" : "");
    try {
      const thread = createThread(title);
      void queryClient.invalidateQueries({ queryKey: ["chat-threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not start the conversation");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-4 pb-8 pt-[clamp(4.5rem,16vh,9rem)]">
      <OperaLogoMark className="h-32 w-32 sm:h-36 sm:w-36" label="Opera AI" />
      <h1 className="mt-5 text-center text-3xl font-medium sm:text-4xl">
        {t("Opera AI", "أوبرا AI")}
      </h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          start(input);
        }}
        className="mt-8 w-full max-w-3xl"
      >
        <div className="chat-composer rounded-[2rem] border border-border bg-card p-3 shadow-2xl sm:p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                start(input);
              }
            }}
            dir={lang === "ar" ? "rtl" : "ltr"}
            rows={2}
            placeholder={t("Ask anything privately", "اسأل عن أي حاجة بخصوصية")}
            className="max-h-40 min-h-[72px] w-full resize-none bg-transparent px-2 py-1 text-xl text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label={t("Attach a file", "إرفاق ملف")}><Paperclip /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label={t("Options", "الخيارات")}><SlidersHorizontal /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => setInput((value) => (value.startsWith("/image ") ? value : `/image ${value}`))} aria-label={t("Generate an image", "توليد صورة")}><Zap /></Button>
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-full" aria-label={t("Voice input", "إدخال صوتي")}><Mic /></Button>
            <Button type="submit" size="icon" disabled={!input.trim() || busy} className="h-11 w-11 rounded-full" aria-label={t("Send", "إرسال")}><ArrowUp /></Button>
          </div>
        </div>
      </form>
      <div className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
        {[
          { icon: Lightbulb, en: "Chat suggestions", ar: "اقتراحات المحادثة", value: "Give me a useful idea" },
          { icon: Image, en: "Create & edit images", ar: "إنشاء وتعديل الصور", value: "/image " },
          { icon: AudioLines, en: "Voice chat", ar: "محادثة صوتية", value: "" },
          { icon: Sparkles, en: "Explore Opera AI", ar: "اكتشف أوبرا AI", value: "What can you help me with?" },
        ].map((item) => (
          <Button key={item.en} type="button" variant="secondary" className="h-11 rounded-full px-4 text-sm" onClick={() => setInput(item.value)}>
            <item.icon />{t(item.en, item.ar)}
          </Button>
        ))}
      </div>
    </div>
  );
}
