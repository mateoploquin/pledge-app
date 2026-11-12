import Anthropic from "@anthropic-ai/sdk";
import { betaMemoryTool, type MemoryToolHandlers } from "@anthropic-ai/sdk/helpers/beta/memory";
import { db, pledgesRef, usageRef, type UsageDay } from "./firebase.js";

/**
 * The coach (v1, text). Claude reads the user's purpose, active pledges, the
 * last week of minutes and the recent conversation, and keeps its own notes
 * per user with the memory tool, stored in Firestore. Voice comes later on
 * the same brain (docs/product.md, "Coach").
 *
 * It has no tool that touches money: it cannot waive, delay or refund a
 * charge. It never sees per-app usage (Apple keeps that on the phone).
 */

const MODEL = "claude-opus-5-5";
/** Messages a user can send per day; every one is paid for. */
export const COACH_DAILY_LIMIT = 40;
const HISTORY = 30;
const TEXT_MAX = 2000;

export type CoachContext = "home" | "limit" | "pledge_started";
export const COACH_CONTEXTS: CoachContext[] = ["home", "limit", "pledge_started"];

export type CoachMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  /** A context note sent for the coach, not typed by the user; not shown. */
  hidden?: boolean;
};

const userRef = (uid: string) => db().collection("users").doc(uid);
export const coachMessagesRef = (uid: string) => userRef(uid).collection("coachMessages");
const coachFilesRef = (uid: string) => userRef(uid).collection("coachFiles");

let client: Anthropic | undefined;
const anthropic = () => (client ??= new Anthropic());

export const coachConfigured = () => !!process.env.ANTHROPIC_API_KEY;

// Frozen, so the cache prefix holds across users and turns.
const SYSTEM = `You are the coach inside Pledge, an iPhone app. People pick apps, set a daily screen-time limit, choose 7, 15 or 30 days and put money down. Screen Time blocks the apps at the limit. Unlocking early, deleting Pledge or turning off Screen Time access charges the pledge. Keeping their word costs nothing.

Pledge exists to help people live closer to their purpose. Your job is to help this one person do that: understand what they want their time for, notice how their days are actually going, and help them keep their word.

How you speak:
- Like a calm friend who means it. Second person, plain words, short. Usually two to four sentences; never more than a short paragraph unless they ask.
- One question at a time. Ask more than you tell. Use their own words for their purpose.
- Say "your word", "keep your word", "give up". Never "challenge", "penalty", "fine", "fail".
- No lists, no headings, no emoji. Plain text only.

What you know and don't:
- Each turn you get a <context> block: their pledges (limit, length, stake, purpose), the minutes they used on the pledged apps for recent days (in 5-minute steps, as their phone reported them) and why they opened you. Today's numbers can lag by a few minutes.
- You cannot see which apps they chose, per-app times or anything outside their pledged apps. Apple keeps that on the phone. Never pretend otherwise; if they want a number you don't have, say so.
- You cannot change a pledge, unlock apps, waive, delay or refund a charge. If they ask, say plainly that you can't, and that the app's own buttons do what they say. Don't argue them out of a choice that's theirs; help them make it with their purpose in view.

Memory:
- You have a memory directory. Check /memories at the start of a conversation. Keep three files, short and current: /memories/profile.md (who they are, how they like to be spoken to), /memories/purpose.md (what their time is for, in their words, and how it's going), /memories/notes.md (patterns you notice, what helped, what to follow up on, with dates).
- Update them when you learn something that will matter next time. Don't store anything they ask you to forget, and never store passwords, card details or other people's private details.

Care:
- You are not a therapist or a doctor. If someone talks about harming themselves or being in danger, respond with warmth, encourage them to contact local emergency services or a crisis line right now (in the US, call or text 988), and stay with them in the conversation.`;

const OPENERS: Record<CoachContext, string> = {
  pledge_started:
    "They just locked in a new pledge and opened you for the first time with it. Greet them briefly, reflect their purpose back in their words if they gave one (or ask what the time is for if they didn't), and ask one question.",
  limit:
    "They just reached today's limit on a pledge and opened you from that moment. Acknowledge it without drama, connect it to what the time is for, and ask one question.",
  home: "They opened you from Home. Pick up where you left off, or ask how today is going.",
};

const localDate = (d: Date) => d.toISOString().slice(0, 10);

/** What the coach knows this turn: pledges, the last 7 days, the trigger. */
async function contextBlock(uid: string, context: CoachContext): Promise<string> {
  const [pledgeSnap, usageSnap] = await Promise.all([
    pledgesRef(uid).where("status", "==", "active").get(),
    usageRef(uid).orderBy("__name__", "desc").limit(7).get(),
  ]);
  const pledges = pledgeSnap.docs.map((d) => {
    const p = d.data();
    return `- pledge ${d.id}: ${p.timeValue} min a day, ${p.durationDays} days (started ${String(p.createdAt).slice(0, 10)}, ends ${String(p.endsAt).slice(0, 10)}), $${p.pledgeValue} at stake. Purpose: ${p.purpose ? JSON.stringify(p.purpose) : "not given"}`;
  });
  const days = usageSnap.docs.map((d) => {
    const day = d.data() as Record<string, UsageDay>;
    const parts = Object.entries(day).map(
      ([id, u]) => `${id} ${u.minutes}/${u.limit} min${u.limitReached ? " (limit reached)" : ""}`
    );
    return `- ${d.id}: ${parts.join("; ")}`;
  });
  return [
    "<context>",
    `Today (UTC): ${localDate(new Date())}`,
    "Active pledges:",
    ...(pledges.length ? pledges : ["- none"]),
    "Minutes on pledged apps, recent days (phone's local date):",
    ...(days.length ? days : ["- nothing reported yet"]),
    `Why they opened you: ${OPENERS[context]}`,
    "</context>",
  ].join("\n");
}

// --- Memory: one Firestore doc per file under users/<uid>/coachFiles. ---

const ROOT = "/memories";
const toId = (path: string) => {
  const clean = path.replace(/\/+$/, "");
  if (!clean.startsWith(`${ROOT}/`)) throw new Error(`Paths must be inside ${ROOT}`);
  const name = clean.slice(ROOT.length + 1);
  if (!/^[\w.\-]{1,80}$/.test(name)) throw new Error("Use a plain file name directly inside /memories");
  return name;
};

function memoryHandlers(uid: string): MemoryToolHandlers {
  const files = coachFilesRef(uid);
  const read = async (path: string) => {
    const snap = await files.doc(toId(path)).get();
    if (!snap.exists) throw new Error(`${path} does not exist`);
    return String(snap.get("text") ?? "");
  };
  const write = (path: string, text: string) =>
    files.doc(toId(path)).set({ text: text.slice(0, 20000), updatedAt: new Date().toISOString() });

  return {
    async view({ path, view_range }) {
      if (path.replace(/\/+$/, "") === ROOT) {
        const snap = await files.get();
        if (snap.empty) return `${ROOT} is empty.`;
        return [`Files in ${ROOT}:`, ...snap.docs.map((d) => `- ${ROOT}/${d.id}`)].join("\n");
      }
      const lines = (await read(path)).split("\n");
      const [from, to] = view_range ?? [1, lines.length];
      const end = to === -1 ? lines.length : to;
      return lines
        .slice(from - 1, end)
        .map((l, i) => `${String(from + i).padStart(4)}\t${l}`)
        .join("\n");
    },
    async create({ path, file_text }) {
      await write(path, file_text);
      return `Saved ${path}.`;
    },
    async str_replace({ path, old_str, new_str }) {
      const text = await read(path);
      const count = text.split(old_str).length - 1;
      if (count !== 1) throw new Error(`old_str must occur exactly once in ${path} (found ${count})`);
      await write(path, text.replace(old_str, new_str));
      return `Edited ${path}.`;
    },
    async insert({ path, insert_line, insert_text }) {
      const lines = (await read(path)).split("\n");
      lines.splice(Math.max(0, Math.min(insert_line, lines.length)), 0, insert_text);
      await write(path, lines.join("\n"));
      return `Inserted into ${path}.`;
    },
    async delete({ path }) {
      await files.doc(toId(path)).delete();
      return `Deleted ${path}.`;
    },
    async rename({ old_path, new_path }) {
      const text = await read(old_path);
      await write(new_path, text);
      await files.doc(toId(old_path)).delete();
      return `Renamed ${old_path} to ${new_path}.`;
    },
  };
}

// --- Daily cap ---

/** Counts one message against today's cap; false when the cap is reached. */
async function takeQuota(uid: string): Promise<boolean> {
  const today = localDate(new Date());
  return db().runTransaction(async (tx) => {
    const ref = userRef(uid);
    const data = (await tx.get(ref)).data() ?? {};
    const count = data.coachDay === today ? Number(data.coachCount ?? 0) : 0;
    if (count >= COACH_DAILY_LIMIT) return false;
    tx.set(ref, { coachDay: today, coachCount: count + 1 }, { merge: true });
    return true;
  });
}

export async function listMessages(uid: string): Promise<CoachMessage[]> {
  const snap = await coachMessagesRef(uid).orderBy("createdAt", "desc").limit(100).get();
  return snap.docs.map((d) => d.data() as CoachMessage).reverse();
}

export class CoachLimitError extends Error {}

/**
 * One turn: stores the user's message (or a hidden context note when they
 * opened the coach without typing), runs Claude with memory, stores and
 * returns the reply.
 */
export async function coachTurn(uid: string, text: string, context: CoachContext): Promise<CoachMessage> {
  const typed = text.trim().slice(0, TEXT_MAX);
  if (!(await takeQuota(uid))) {
    throw new CoachLimitError("That's all the coaching for today. Pick it up again tomorrow.");
  }

  const [history, ctx] = await Promise.all([listMessages(uid), contextBlock(uid, context)]);
  const recent = history.slice(-HISTORY);

  const now = new Date().toISOString();
  const userMessage: CoachMessage = typed
    ? { role: "user", text: typed, createdAt: now }
    : { role: "user", text: "(Opened the coach.)", createdAt: now, hidden: true };

  // Text-only history; the API merges consecutive same-role turns.
  const messages: Anthropic.Beta.BetaMessageParam[] = recent.map((m) => ({ role: m.role, content: m.text }));
  if (messages[0]?.role === "assistant") messages.unshift({ role: "user", content: "(Earlier conversation.)" });
  messages.push({ role: "user", content: `${ctx}\n\n${userMessage.text}` });

  const runner = anthropic().beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [betaMemoryTool(memoryHandlers(uid))],
    messages,
    max_iterations: 8,
  });
  const final = await runner.runUntilDone();

  let reply = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (final.stop_reason === "refusal" || !reply) {
    reply = "I can't help with that one. What's on your mind about your pledge?";
  }

  const assistant: CoachMessage = { role: "assistant", text: reply, createdAt: new Date().toISOString() };
  const batch = db().batch();
  batch.set(coachMessagesRef(uid).doc(), userMessage);
  batch.set(coachMessagesRef(uid).doc(), assistant);
  await batch.commit();
  return assistant;
}
