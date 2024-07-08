import { slackApp } from "../index";
import { db } from "../db/index";
import * as schema from "../db/schema";

import { t } from "../lib/template";
import { clog } from "../utils/Logger";
import { like } from "drizzle-orm";

const fetchAction = async (
) => {
    // listen for shortcut
    slackApp.shortcut("fetch", async () => { },
        async ({ context, payload }) => {
            // first check if the message is in the arcade channel
            // @ts-expect-error
            if (context.channelId !== "C06SBHMQU8G" || payload.message.bot_id !== "B077ZPZ3RB7") {
                // @ts-expect-error
                clog(`User tried to fetch data in wrong channel: ${payload.message.channel} or bot: ${payload.message.bot_id}`, "error");
                return;
            }

            // check if user is in db
            const user = await db.select().from(schema.users).where(like(schema.users.userID, payload.user.id))

            const expireTime = await fetch("https://hackhour.hackclub.com/api/clock/" + payload.user.id).then(res => res.text()).then(text => new Date(new Date().getTime() + (parseInt(text))).getTime())
            const arcadeSessionDone = (expireTime - new Date().getTime()) > 0 ? 1 : 0

            if (arcadeSessionDone === 1) {
                if (user.length === 0) {
                    clog(`User not found in DB: ${payload.user.id}`, "error");

                    const user = await context.client.users.info({ user: payload.user.id })
                    // @ts-expect-error
                    await db.insert(schema.users).values({ userName: user.user!.name, userID: payload.user.id, installed: 0, threadTS: payload.message.thread_ts, expireTime, arcadeSessionDone }).execute();

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
                    // update thread ts
                    // @ts-expect-error
                    await db.update(schema.users).set({ threadTS: payload.message.thread_ts, expireTime, arcadeSessionDone }).where(like(schema.users.userID, payload.user.id)).execute();

                    // send a message in the thread
                    await context.client.chat.postMessage({
                        // @ts-expect-error
                        channel: payload.channel.id,
                        // @ts-expect-error
                        thread_ts: payload.message.thread_ts,
                        text: t("fetch.success", { user_id: payload.user.id })
                    });
                }
            } else {
                clog(`User's arcade session is over: ${payload.user.id}`, "info");
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
                            { type: "section", text: { type: "mrkdwn", text: t("fetch.expired", { user_id: payload.user.id }) } },
                        ]
                    }
                });
            }
        }
    );
}

export default fetchAction;