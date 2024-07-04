import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey(),
    userID: text("user_id"),
    userName: text("user_name"),
    viewID: text("view_id"),
    githubUser: text("github_user"),
    installed: integer("installed"),
    threadTS: text("thread_ts"),
    expireTime: integer("expire_time"),
    arcadeSessionDone: integer("arcade_session_done"),
});