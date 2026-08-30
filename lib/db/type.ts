import { InferSelectModel } from "drizzle-orm";
import { chats, messages, users } from "./schema";

export type UserModel = InferSelectModel<typeof users>;
export type ChatModel = InferSelectModel<typeof chats>;
export type MessageModel = InferSelectModel<typeof messages>;