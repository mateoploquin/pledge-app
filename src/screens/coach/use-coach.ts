import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CoachContext, CoachMessage, coachError, fetchCoachMessages, sendCoachMessage } from "../../services/coach-api";
import { track } from "../../services/analytics";

/**
 * The conversation with the coach. Opened at a moment (`context` route
 * param: a pledge just started, a limit just hit), the coach speaks first.
 */
export const useCoach = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const context: CoachContext = route.params?.context ?? "home";

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState("");
  const opened = useRef(false);

  const ask = useCallback(async (text: string, ctx: CoachContext) => {
    setSending(true);
    setError(undefined);
    try {
      const reply = await sendCoachMessage(text, ctx);
      setMessages((m) => [...m, reply]);
    } catch (e) {
      setError(coachError(e));
    } finally {
      setSending(false);
    }
  }, []);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    track("coach_opened", { context });
    fetchCoachMessages()
      .then(setMessages)
      .catch((e) => setError(coachError(e)))
      .finally(() => {
        setLoading(false);
        if (context !== "home") ask("", context);
      });
  }, [ask, context]);

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text, createdAt: new Date().toISOString() }]);
    track("coach_message_sent", { length: text.length });
    ask(text, "home");
  };

  return { navigation, messages, loading, sending, error, draft, setDraft, send };
};
