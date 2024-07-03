import { slackApp } from "../index";
import { db } from "../db/index";
import * as schema from "../db/schema";

import { t } from "../lib/template";
import clog, { blog } from "../utils/Logger";
import { like } from "drizzle-orm";

const fetch = async (
) => {
    // listen for shortcut
    slackApp.shortcut("fetch", async () => { },
        async ({ context, payload }) => {
            // first check if the message is in the arcade channel
            // @ts-expect-error
            if (payload.message.channel !== "C06SBHMQU8G" || payload.message.bot_id !== "B077ZPZ3RB7") {
                return;
            }

            // check if user is in db
            const user = await db.select().from(schema.users).where(like(schema.users.userID, payload.user.id))

            if (user.length === 0) {
                clog(`User not found in DB: ${payload.user.id}`, "error");

                const user = await context.client.users.info({ user: payload.user.id })
                // @ts-expect-error
                await db.insert(schema.users).values({ userName: user.user!.name, userID: payload.user.id, installed: 0, threadTS: payload.message.thread_ts }).execute();

                // send a view to the user
                await context.client.views.open({
                    trigger_id: payload.trigger_id,
                    view: {
                        type: "modal",
                        title: {
                            type: "plain_text",
                            text: "Fetch Data",
                            emoji: true
                        },
                        close: {
                            type: "plain_text",
                            text: "Cancel (grolf sad)",
                            emoji: true
                        },
                        blocks: [
                            { type: "context", elements: [{ type: "mrkdwn", text: t("fetch.not_found", { user_id: payload.user.id }) }] },
                            { type: "divider" },
                            { type: "section", text: { type: "mrkdwn", text: "Can you please enter your :github: user name? my friends :octocat: and :grolf-bg: need it to send your git scraps yourway" } },
                            {
                                dispatch_action: true,
                                type: "input",
                                element: {
                                    type: "plain_text_input",
                                    action_id: "fetchGithub",
                                    placeholder: {
                                        type: "plain_text",
                                        text: "Enter your :beautiful: user name",
                                        emoji: true
                                    }
                                },
                                label: {
                                    type: "plain_text",
                                    text: "Your Username",
                                }
                            }
                        ]
                    }
                });
                return;
            } else {
                clog(`User found in DB: ${payload.user.id}`, "info");

                // update thread ts
                // @ts-expect-error
                await db.update(schema.users).set({ threadTS: payload.message.thread_ts }).where(like(schema.users.userID, payload.user.id)).execute();

                // send a view to the user
                await context.client.views.open({
                    trigger_id: payload.trigger_id,
                    view: {
                        type: "modal",
                        title: {
                            type: "plain_text",
                            text: "Fetch Data",
                            emoji: true
                        },
                        close: {
                            type: "plain_text",
                            text: "Cancel (grolf sad)",
                            emoji: true
                        },
                        blocks: [
                            { type: "context", elements: [{ type: "mrkdwn", text: t("fetch.success", { user_id: payload.user.id }) }] },
                            { type: "divider" },
                            { type: "section", text: { type: "mrkdwn", text: "Thanks for telling Grolf about this thread!" } },
                        ]
                    }
                });
            }

            clog(`User found in DB: ${payload.user.id}`, "info");
        });
}

export default fetch;