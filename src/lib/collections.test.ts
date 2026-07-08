import { describe, it, expect } from "vitest";
import { patchById, upsertByKey } from "./collections";

interface Item {
  id: string;
  n: number;
  tags?: string[];
}

const sample = (): Item[] => [
  { id: "a", n: 1 },
  { id: "b", n: 2, tags: ["x"] },
  { id: "c", n: 3 },
];

describe("patchById", () => {
  it("applies an object patch to the matching item", () => {
    const list = sample();
    const out = patchById(list, "b", { n: 20 });
    expect(out.find((i) => i.id === "b")).toEqual({ id: "b", n: 20, tags: ["x"] });
  });

  it("applies a function patch derived from the current item (e.g. append)", () => {
    const list = sample();
    const out = patchById(list, "b", (i) => ({ tags: [...(i.tags ?? []), "y"] }));
    expect(out.find((i) => i.id === "b")?.tags).toEqual(["x", "y"]);
  });

  it("passes the matched item to the function patch", () => {
    const list = sample();
    let seen: Item | undefined;
    patchById(list, "c", (i) => {
      seen = i;
      return { n: i.n + 1 };
    });
    expect(seen).toBe(list[2]);
  });

  it("returns a NEW array reference", () => {
    const list = sample();
    expect(patchById(list, "a", { n: 9 })).not.toBe(list);
  });

  it("PRESERVES references of unchanged items (memo correctness)", () => {
    const list = sample();
    const out = patchById(list, "b", { n: 20 });
    expect(out[0]).toBe(list[0]); // "a" untouched
    expect(out[2]).toBe(list[2]); // "c" untouched
  });

  it("creates a NEW reference for the changed item", () => {
    const list = sample();
    const out = patchById(list, "b", { n: 20 });
    expect(out[1]).not.toBe(list[1]);
  });

  it("does not mutate the input list or its items", () => {
    const list = sample();
    const snapshot = JSON.parse(JSON.stringify(list));
    patchById(list, "b", { n: 99 });
    expect(list).toEqual(snapshot);
  });

  it("no match → new array, but ALL item references preserved", () => {
    const list = sample();
    const out = patchById(list, "zzz", { n: 0 });
    expect(out).not.toBe(list);
    expect(out[0]).toBe(list[0]);
    expect(out[1]).toBe(list[1]);
    expect(out[2]).toBe(list[2]);
  });

  it("CAVEAT: an empty patch still produces a new reference for the matched item", () => {
    const list = sample();
    const out = patchById(list, "a", {});
    expect(out[0]).not.toBe(list[0]);
    expect(out[0]).toEqual(list[0]);
  });
});

interface Keyed {
  key: string;
  v: number;
}

const keyed = (): Keyed[] => [
  { key: "k1", v: 1 },
  { key: "k2", v: 2 },
];

const byKey = (i: Keyed) => i.key;

describe("upsertByKey", () => {
  it("updates the existing item when the key is present", () => {
    const list = keyed();
    const out = upsertByKey(list, byKey, "k2", (i) => ({ ...i, v: 99 }), () => ({ key: "k2", v: 0 }));
    expect(out).toHaveLength(2);
    expect(out.find((i) => i.key === "k2")).toEqual({ key: "k2", v: 99 });
  });

  it("appends a created item when the key is absent", () => {
    const list = keyed();
    const out = upsertByKey(list, byKey, "k3", (i) => i, () => ({ key: "k3", v: 3 }));
    expect(out).toHaveLength(3);
    expect(out[2]).toEqual({ key: "k3", v: 3 }); // appended last (order preserved)
  });

  it("returns a NEW array reference on update", () => {
    const list = keyed();
    expect(upsertByKey(list, byKey, "k1", (i) => ({ ...i, v: 5 }), () => ({ key: "k1", v: 0 }))).not.toBe(list);
  });

  it("returns a NEW array reference on append", () => {
    const list = keyed();
    expect(upsertByKey(list, byKey, "kX", (i) => i, () => ({ key: "kX", v: 0 }))).not.toBe(list);
  });

  it("UPDATE branch: preserves references of non-matching items", () => {
    const list = keyed();
    const out = upsertByKey(list, byKey, "k2", (i) => ({ ...i, v: 99 }), () => ({ key: "k2", v: 0 }));
    expect(out[0]).toBe(list[0]); // k1 untouched
  });

  it("APPEND branch: preserves references of all existing items", () => {
    const list = keyed();
    const out = upsertByKey(list, byKey, "k3", (i) => i, () => ({ key: "k3", v: 3 }));
    expect(out[0]).toBe(list[0]);
    expect(out[1]).toBe(list[1]);
  });

  it("update may return the SAME reference to preserve identity (sendForm guard)", () => {
    const list = keyed();
    const out = upsertByKey(list, byKey, "k2", (i) => i, () => ({ key: "k2", v: 0 }));
    expect(out[1]).toBe(list[1]); // matched item ref preserved when update is identity
    expect(out).not.toBe(list); // ...but the array is still new (map)
  });

  it("does not mutate the input list", () => {
    const list = keyed();
    const snapshot = JSON.parse(JSON.stringify(list));
    upsertByKey(list, byKey, "k1", (i) => ({ ...i, v: 42 }), () => ({ key: "k1", v: 0 }));
    expect(list).toEqual(snapshot);
  });
});
