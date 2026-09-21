import { createInterface } from "readline";
import { initSchema, upsertMany } from "../lib/db";
import type { Transaction } from "../lib/types";

const CATEGORIES = [
  "Chai",
  "Eat Out",
  "Fashion",
  "Food",
  "Groceries",
  "Misc",
  "Shopping",
  "Subscriptions",
  "Transport",
  "Utilities",
];

const BATCH_SIZE = 25;
const failed: Transaction[] = [];

interface IO {
  ask: (q: string) => Promise<string>;
  status: (msg: string) => void;
  log: (msg: string) => void;
  close: () => void;
}

// Interactive mode: raw stdin so async status lines never corrupt the prompt.
// The current prompt + typed input are redrawn after every status message.
function openInteractive(): IO & { aborted: boolean } {
  const state: { aborted: boolean } = { aborted: false };
  let prompt = "";
  let input = "";
  let resolver: ((v: string) => void) | null = null;

  function render() {
    process.stdout.write("\r\x1b[K" + prompt + input);
  }

  function status(msg: string) {
    process.stdout.write("\r\x1b[K" + msg + "\n");
    render();
  }

  function ask(q: string): Promise<string> {
    prompt = q;
    input = "";
    render();
    return new Promise((res) => {
      resolver = res;
    });
  }

  function submit() {
    const value = input;
    process.stdout.write("\n");
    prompt = "";
    input = "";
    const r = resolver;
    resolver = null;
    if (r) r(value);
  }

  function interrupt() {
    // Treat Ctrl+C / Ctrl+D as "finish now", like a blank amount.
    state.aborted = true;
    if (resolver) submit();
  }

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk: string) => {
    for (const ch of chunk) {
      if (ch === "\u0003" || ch === "\u0004") {
        // Ctrl+C or Ctrl+D
        interrupt();
        continue;
      }
      if (ch === "\r" || ch === "\n") {
        submit();
        continue;
      }
      if (ch === "\u007f" || ch === "\b") {
        input = input.slice(0, -1);
        render();
        continue;
      }
      if (ch === "\u0015") {
        // Ctrl+U: clear the line
        input = "";
        render();
        continue;
      }
      if (ch.charCodeAt(0) < 32) continue;
      input += ch;
      render();
    }
  });

  return {
    get aborted() {
      return state.aborted;
    },
    ask,
    status,
    log: (msg) => status(msg),
    close: () => {
      process.stdin.removeAllListeners("data");
      process.stdin.setRawMode(false);
      process.stdin.pause();
    },
  };
}

// Piped mode: plain line-by-line reading; status lines simply print above.
function openPiped(): IO {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q: string): Promise<string> => {
    process.stdout.write(q);
    const { value } = await rl[Symbol.asyncIterator]().next();
    return value ?? "";
  };
  return {
    ask,
    status: (msg) => console.log(msg),
    log: (msg) => console.log(msg),
    close: () => rl.close(),
  };
}

async function main() {
  // Start schema init in the background — don't make the user wait for it.
  const schemaReady = initSchema();

  const interactive = process.stdin.isTTY === true;
  const io = interactive ? openInteractive() : openPiped();

  const queue: Transaction[] = [];
  let draining = false;
  let drainingDone: Promise<void> = Promise.resolve();

  function enqueueStatus(tx: Transaction): string {
    return `  … queued ₹${Math.abs(tx.price)} — ${tx.category} (pushing in background)`;
  }

  function pushedStatus(tx: Transaction): string {
    return `  ✓ pushed ₹${Math.abs(tx.price)} — ${tx.category} on ${tx.date} ${tx.time}${
      tx.notes ? ` ("${tx.notes}")` : ""
    }`;
  }

  async function drain() {
    if (draining) return drainingDone;
    draining = true;
    drainingDone = (async () => {
      await schemaReady;
      while (queue.length > 0) {
        const batch = queue.splice(0, BATCH_SIZE);
        try {
          await upsertMany(batch);
          for (const tx of batch) io.status(pushedStatus(tx));
        } catch (e) {
          io.status(
            `  ✗ failed to push ${batch.length} (${
              e instanceof Error ? e.message : e
            }). Will retry on next entry.`
          );
          batch.forEach((tx) => {
            queue.unshift(tx);
            if (!failed.includes(tx)) failed.push(tx);
          });
          break;
        }
      }
    })();
    return drainingDone.finally(() => {
      draining = false;
    });
  }

  function enqueue(tx: Transaction) {
    queue.push(tx);
    io.status(enqueueStatus(tx));
    void drain();
  }

  io.log("💸 Expense Tracker CLI");
  io.log("Enter expenses one after another. Leave Amount blank to finish.");
  io.log("");
  io.log("Categories:");
  CATEGORIES.forEach((c, i) => io.log(`  ${i + 1}. ${c}`));
  io.log("");

  try {
    const aborted = (): boolean => interactive && (io as IO & { aborted: boolean }).aborted;
    for (;;) {
      const priceStr = (await io.ask("Amount (₹, blank to finish): ")).trim();
      if (aborted()) break;
      if (!priceStr) break;

      const price = parseFloat(priceStr);
      if (!(Number.isFinite(price) && price > 0)) {
        io.status("  ⚠ Invalid amount, skipped. Try again.");
        continue;
      }

      const catChoice = (await io.ask(`Category [1-${CATEGORIES.length}] (default: 1): `)).trim();
      if (aborted()) break;
      const catIdx = parseInt(catChoice, 10) - 1;
      const category = CATEGORIES[catIdx >= 0 && catIdx < CATEGORIES.length ? catIdx : 0];

      const now = new Date();
      const defaultDate = now.toISOString().slice(0, 10);
      const defaultTime = now.toTimeString().slice(0, 5);

      const rawDate = (await io.ask(`Date [YYYY-MM-DD HH:mm] (default: ${defaultDate} ${defaultTime}): `)).trim();
      if (aborted()) break;
      const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/.exec(rawDate);
      const date = m?.[1] ?? defaultDate;
      const time = m?.[2] ?? defaultTime;

      const notes = (await io.ask("Notes (optional): ")).trim();
      if (aborted()) break;

      enqueue({
        id: "",
        date,
        time: time || "00:00",
        category,
        price: -price,
        currency: "INR",
        notes,
      });
    }
  } finally {
    io.close();
  }

  // End of input: stop prompting and wait for the queue to fully flush.
  await drain();
  if (failed.length > 0) {
    console.error(`\n⚠ ${failed.length} expense(s) could not be pushed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll expenses pushed to the cloud. ✨");
  }
}

main().catch((e) => {
  console.error("\n❌ Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});