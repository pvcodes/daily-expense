import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authenticate, isKnownUser, listUsers, requireUser } from "./users";
import { AUTH_COOKIE, createAuthToken, sessionUserId, verifyAuthToken } from "./auth";

const ENV_KEYS = ["APP_USERS", "APP_PASSWORD", "APP_SECRET"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  process.env.APP_SECRET = "test-secret";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function reqWithCookie(token: string): Request {
  return new Request("http://localhost/api/transactions", {
    headers: { cookie: `${AUTH_COOKIE}=${token}` },
  });
}

describe("listUsers", () => {
  it("parses comma-separated id:passcode pairs", () => {
    process.env.APP_USERS = "me:alpha, bubu:bubu27";
    expect(listUsers().map((u) => u.id)).toEqual(["me", "bubu"]);
  });

  it("keeps colons inside a passcode", () => {
    process.env.APP_USERS = "me:a:b:c";
    expect(authenticate("a:b:c")?.id).toBe("me");
  });

  it("normalises ids and skips malformed or duplicate entries", () => {
    process.env.APP_USERS = "ME:alpha,ME:beta,broken,Bad Id:x,:nopass,ok:secret";
    expect(listUsers().map((u) => u.id)).toEqual(["me", "ok"]);
  });

  it("falls back to the single-user APP_PASSWORD as 'me'", () => {
    process.env.APP_PASSWORD = "solo";
    expect(listUsers()).toEqual([{ id: "me", passcode: "solo" }]);
  });

  it("returns nothing when no credentials are configured", () => {
    expect(listUsers()).toEqual([]);
  });
});

describe("authenticate", () => {
  beforeEach(() => {
    process.env.APP_USERS = "me:alpha,bubu:bubu27";
  });

  it("maps each passcode to its own user", () => {
    expect(authenticate("alpha")?.id).toBe("me");
    expect(authenticate("bubu27")?.id).toBe("bubu");
  });

  it("rejects unknown, empty and partial passcodes", () => {
    expect(authenticate("nope")).toBeNull();
    expect(authenticate("")).toBeNull();
    expect(authenticate("bubu")).toBeNull();
    expect(authenticate("bubu27x")).toBeNull();
  });
});

describe("verifyAuthToken", () => {
  beforeEach(() => {
    process.env.APP_USERS = "me:alpha,bubu:bubu27";
  });

  it("round-trips the user id", async () => {
    expect(await verifyAuthToken(await createAuthToken("bubu"))).toBe("bubu");
  });

  it("rejects a tampered payload, mac, or missing token", async () => {
    const token = await createAuthToken("bubu");
    const [id, exp, mac] = token.split(".");
    expect(await verifyAuthToken(`${id}x.${exp}.${mac}`)).toBeNull();
    expect(await verifyAuthToken(`${id}.${exp}.${mac}x`)).toBeNull();
    expect(await verifyAuthToken(`${id}.${exp}.${mac}.extra`)).toBeNull();
    expect(await verifyAuthToken("")).toBeNull();
    expect(await verifyAuthToken(undefined)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createAuthToken("bubu");
    process.env.APP_SECRET = "other-secret";
    expect(await verifyAuthToken(token)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const exp = Date.now() - 1;
    const mac = await createAuthToken("bubu").then((t) => t.split(".")[2]);
    expect(await verifyAuthToken(`bubu.${exp}.${mac}`)).toBeNull();
  });

  it("rejects a user that no longer exists in APP_USERS", async () => {
    expect(await verifyAuthToken(await createAuthToken("ghost"))).toBeNull();
  });
});

describe("sessionUserId", () => {
  beforeEach(() => {
    process.env.APP_USERS = "me:alpha,bubu:bubu27";
  });

  it("reads the user id from the auth cookie", async () => {
    const token = await createAuthToken("bubu");
    expect(await sessionUserId(reqWithCookie(token))).toBe("bubu");
  });

  it("returns null without a cookie or with a foreign one", async () => {
    expect(
      await sessionUserId(new Request("http://localhost/api/transactions"))
    ).toBeNull();
    expect(await sessionUserId(reqWithCookie("session=abc"))).toBeNull();
    expect(await sessionUserId(reqWithCookie("nonsense"))).toBeNull();
  });
});

describe("requireUser", () => {
  beforeEach(() => {
    process.env.APP_USERS = "me:alpha,bubu:bubu27";
  });

  it("defaults to 'me' and accepts known ids", () => {
    expect(requireUser()).toBe("me");
    expect(requireUser("bubu")).toBe("bubu");
    expect(requireUser(" BUBU ")).toBe("bubu");
  });

  it("throws for unknown ids", () => {
    expect(() => requireUser("ghost")).toThrow(/Unknown user/);
    expect(isKnownUser("ghost")).toBe(false);
  });
});