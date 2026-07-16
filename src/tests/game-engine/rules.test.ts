import { describe, it, expect } from "vitest";
import { isPlayable, canStack, requiresColorChoice, getInitialColor } from "@/game-engine/rules";
import { Card } from "@/game-engine/types";

const red7: Card = { type: "number", color: "red", value: 7 };
const blue7: Card = { type: "number", color: "blue", value: 7 };
const red3: Card = { type: "number", color: "red", value: 3 };
const skipRed: Card = { type: "skip", color: "red" };
const skipBlue: Card = { type: "skip", color: "blue" };
const draw2Red: Card = { type: "draw2", color: "red" };
const wild: Card = { type: "wild" };
const wild4: Card = { type: "wild4" };

describe("isPlayable", () => {
  it("color match", () => expect(isPlayable(red7, red3, "red")).toBe(true));
  it("number match", () => expect(isPlayable(blue7, red7, "red")).toBe(true));
  it("type match", () => expect(isPlayable(skipBlue, skipRed, "red")).toBe(true));
  it("rejects different", () => expect(isPlayable(blue7, red3, "red")).toBe(false));
  it("wild always", () => expect(isPlayable(wild, red7, "red")).toBe(true));
  it("wild4 always", () => expect(isPlayable(wild4, red7, "red")).toBe(true));
});

describe("canStack", () => {
  it("same type", () => expect(canStack(draw2Red, { type: "draw2", count: 1 })).toBe(true));
  it("different type", () => expect(canStack(skipRed, { type: "draw2", count: 1 })).toBe(false));
  it("null chain", () => expect(canStack(draw2Red, null)).toBe(false));
  it("wild on wild", () => expect(canStack(wild, { type: "wild", count: 1 })).toBe(true));
  it("wild4 on wild4", () => expect(canStack(wild4, { type: "wild4", count: 1 })).toBe(true));
});

describe("requiresColorChoice", () => {
  it("wild yes", () => expect(requiresColorChoice(wild)).toBe(true));
  it("wild4 yes", () => expect(requiresColorChoice(wild4)).toBe(true));
  it("number no", () => expect(requiresColorChoice(red7)).toBe(false));
});

describe("getInitialColor", () => {
  it("card color", () => expect(getInitialColor(red7)).toBe("red"));
  it("wild undefined", () => expect(getInitialColor(wild)).toBeUndefined());
});
