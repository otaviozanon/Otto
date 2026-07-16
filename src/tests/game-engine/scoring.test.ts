import { describe, it, expect } from "vitest";
import { buildRanking } from "@/game-engine/scoring";
import { startGame } from "@/game-engine/game";
import { createRoom, joinRoom } from "@/game-engine/room";

describe("buildRanking", () => {
  it("ranks winner first", () => {
    let r = joinRoom(joinRoom(createRoom("A"), "B"), "C");
    let s = startGame(r);
    const wid = s.players[0].id;
    s = { ...s, players: s.players.map((p) => p.id === wid ? { ...p, hand: [] } : p) };
    expect(buildRanking(s)[0].id).toBe(wid);
  });

  it("ranks by fewer cards", () => {
    let r = joinRoom(createRoom("A"), "B");
    let s = startGame(r);
    const [p1, p2] = s.players;
    s = { ...s, players: [{ ...p1, hand: [] }, { ...p2, hand: [{ type: "number", color: "red", value: 3 } as any] }] };
    const rank = buildRanking(s);
    expect(rank[0].id).toBe(p1.id);
    expect(rank[1].id).toBe(p2.id);
  });
});
