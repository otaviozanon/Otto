import { describe, it, expect } from "vitest";
import { createRoom, joinRoom, removePlayer, setPlayerDisconnected } from "@/game-engine/room";

describe("createRoom", () => {
  it("creates room with host", () => {
    const r = createRoom("Alice");
    expect(r.players).toHaveLength(1);
    expect(r.host).toBe(r.players[0].id);
    expect(r.status).toBe("lobby");
    expect(r.id).toMatch(/^[A-Z0-9]{6}$/);
  });
});

describe("joinRoom", () => {
  it("adds player", () => expect(joinRoom(createRoom("A"), "B").players).toHaveLength(2));
  it("throws at 15", () => {
    let r = createRoom("H");
    for (let i = 1; i < 15; i++) r = joinRoom(r, `P${i}`);
    expect(() => joinRoom(r, "Extra")).toThrow("Sala cheia");
  });
  it("throws if started", () => {
    expect(() => joinRoom({ ...createRoom("H"), status: "playing" }, "L")).toThrow("Jogo ja iniciado");
  });
});

describe("removePlayer", () => {
  it("transfers host", () => {
    const r = joinRoom(createRoom("A"), "B");
    const u = removePlayer(r, r.players[0].id);
    expect(u.players).toHaveLength(1);
    expect(u.host).toBe(u.players[0].id);
  });
});

describe("setPlayerDisconnected", () => {
  it("marks disconnected", () => {
    const r = createRoom("A");
    expect(setPlayerDisconnected(r, r.players[0].id).players[0].connected).toBe(false);
  });
});
