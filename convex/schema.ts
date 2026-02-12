import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const sizeValidator = v.object({
  width: v.number(),
  height: v.number(),
});

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    noteId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    position: positionValidator,
    size: sizeValidator,
    connections: v.array(v.string()),
    isOpen: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_noteId", ["userId", "noteId"]),
});
