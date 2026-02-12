import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const INITIAL_NOTE_WIDTH = 300;
const INITIAL_NOTE_HEIGHT = 200;

const positionValidator = v.object({
  x: v.number(),
  y: v.number(),
});

const sizeValidator = v.object({
  width: v.number(),
  height: v.number(),
});

const updateValidator = v.object({
  title: v.optional(v.string()),
  content: v.optional(v.string()),
  position: v.optional(positionValidator),
  size: v.optional(sizeValidator),
  isOpen: v.optional(v.boolean()),
});

const WELCOME_NOTE_ID = "welcome-note";
const WELCOME_TITLE = "Welcome to ink-note";
const WELCOME_CONTENT =
  "This is a minimalistic, node-based note taking app.\n\nDrag this window around!";

const requireUserId = async (ctx: { auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> } }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity.tokenIdentifier;
};

const parseConnections = (content: string, sourceId: string): string[] => {
  const matches = content.matchAll(/data-id="([^"]+)"/g);
  const connections = new Set<string>();

  for (const match of matches) {
    const targetId = match[1];
    if (!targetId || targetId === sourceId) {
      continue;
    }
    connections.add(targetId);
  }

  return Array.from(connections);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listNotes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return notes.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const ensureWelcomeNote = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return { created: false };
    }

    const now = Date.now();
    await ctx.db.insert("notes", {
      userId,
      noteId: WELCOME_NOTE_ID,
      title: WELCOME_TITLE,
      content: WELCOME_CONTENT,
      createdAt: now,
      updatedAt: now,
      position: { x: 100, y: 100 },
      size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
      connections: [],
      isOpen: true,
    });

    return { created: true };
  },
});

export const createNote = mutation({
  args: {
    noteId: v.string(),
    position: positionValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.noteId))
      .unique();

    if (existing) {
      throw new Error(`Note ID collision: ${args.noteId} already exists.`);
    }

    const now = Date.now();
    await ctx.db.insert("notes", {
      userId,
      noteId: args.noteId,
      title: "New Note",
      content: "",
      createdAt: now,
      updatedAt: now,
      position: args.position,
      size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
      connections: [],
      isOpen: true,
    });
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.string(),
    updates: updateValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const note = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.noteId))
      .unique();

    if (!note) {
      throw new Error("Note not found");
    }

    const patch: {
      title?: string;
      content?: string;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      isOpen?: boolean;
      connections?: string[];
      updatedAt?: number;
    } = {};

    if (args.updates.title !== undefined) {
      patch.title = args.updates.title;
    }

    if (args.updates.content !== undefined) {
      patch.content = args.updates.content;
      patch.connections = parseConnections(args.updates.content, note.noteId);
    }

    if (args.updates.position !== undefined) {
      patch.position = args.updates.position;
    }

    if (args.updates.size !== undefined) {
      patch.size = args.updates.size;
    }

    if (args.updates.isOpen !== undefined) {
      patch.isOpen = args.updates.isOpen;
    }

    if (args.updates.title !== undefined || args.updates.content !== undefined) {
      patch.updatedAt = Date.now();
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    await ctx.db.patch(note._id, patch);
  },
});

export const openNote = mutation({
  args: {
    noteId: v.string(),
    position: v.optional(positionValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const note = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.noteId))
      .unique();

    if (!note) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(note._id, {
      isOpen: true,
      ...(args.position ? { position: args.position } : {}),
    });
  },
});

export const closeNote = mutation({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const target = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.noteId))
      .unique();

    if (!target) {
      throw new Error("Note not found");
    }

    if (target.title === "New Note") {
      await ctx.db.delete(target._id);

      const notes = await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      await Promise.all(
        notes.map(async (note) => {
          if (!note.connections.includes(args.noteId)) {
            return;
          }

          await ctx.db.patch(note._id, {
            connections: note.connections.filter((id) => id !== args.noteId),
          });
        }),
      );
      return;
    }

    await ctx.db.patch(target._id, { isOpen: false });
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const target = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.noteId))
      .unique();

    if (!target) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(target._id);

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    await Promise.all(
      notes.map(async (note) => {
        if (!note.connections.includes(args.noteId)) {
          return;
        }

        await ctx.db.patch(note._id, {
          connections: note.connections.filter((id) => id !== args.noteId),
        });
      }),
    );
  },
});

export const changeNoteId = mutation({
  args: {
    oldNoteId: v.string(),
    newNoteId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const source = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.oldNoteId))
      .unique();

    if (!source) {
      throw new Error("Source note not found");
    }

    const collision = await ctx.db
      .query("notes")
      .withIndex("by_user_noteId", (q) => q.eq("userId", userId).eq("noteId", args.newNoteId))
      .unique();

    if (collision) {
      throw new Error(`Note ID collision: ${args.newNoteId} already exists.`);
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const escapedOldId = escapeRegExp(args.oldNoteId);
    const mentionPattern = new RegExp(
      `(<span[^>]*data-id="${escapedOldId}"[^>]*>)([^<]*)</span>`,
      "g",
    );

    const now = Date.now();

    await Promise.all(
      notes.map(async (note) => {
        let didUpdate = false;
        const patch: {
          noteId?: string;
          content?: string;
          connections?: string[];
          updatedAt?: number;
        } = {};

        if (note.noteId === args.oldNoteId) {
          patch.noteId = args.newNoteId;
          didUpdate = true;
        }

        if (note.connections.includes(args.oldNoteId)) {
          patch.connections = note.connections.map((connectionId) =>
            connectionId === args.oldNoteId ? args.newNoteId : connectionId,
          );
          didUpdate = true;
        }

        if (note.content.includes(`data-id="${args.oldNoteId}"`)) {
          patch.content = note.content.replace(mentionPattern, (match, openingTag) => {
            const newOpeningTag = openingTag.replace(
              `data-id="${args.oldNoteId}"`,
              `data-id="${args.newNoteId}"`,
            );
            if (source.title) {
              return `${newOpeningTag}@${source.title}</span>`;
            }
            return match;
          });
          didUpdate = true;
        }

        if (!didUpdate) {
          return;
        }

        patch.updatedAt = now;
        await ctx.db.patch(note._id, patch);
      }),
    );
  },
});
