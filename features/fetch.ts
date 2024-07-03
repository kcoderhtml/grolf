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
            // check if user is in db
            const user = await db.select().from(schema.users).where(like(schema.users.id, payload.user.id))

            if (user.length === 0) {
                clog(`User not found in DB: ${payload.user.id}`, "error");

                // send a view to the user
                await context.client.views.open({
                    trigger_id: payload.trigger_id,
                    view: {
                        type: "modal",
                        callback_id: "fetch",
                        title: {
                            type: "plain_text",
                            text: "Fetch Data",
                            emoji: true
                        },
                        submit: {
                            type: "plain_text",
                            text: "Fetch",
                            emoji: true
                        },
                        blocks: [
                            { type: "context", elements: [{ type: "mrkdwn", text: t("fetch.not_found", { user_id: payload.user.id }) }] },
                            { type: "divider" },
                            { type: "section", text: { type: "mrkdwn", text: "Can you please enter your :github: user name? my friends :octocat: and :grolf-bg: need it to send your git scraps yourway" } },
                            {
                                type: "input",
                                block_id: "fetch",
                                label: {
                                    type: "plain_text",
                                    text: "User Name",
                                    emoji: true
                                },
                                element: {
                                    type: "plain_text_input",
                                    action_id: "fetch",
                                    placeholder: {
                                        type: "plain_text",
                                        text: "Enter your :beautiful: user name",
                                        emoji: true
                                    }
                                }
                            }
                        ]
                    }
                });
                return;
            }

            clog(`User found in DB: ${payload.user.id}`, "info");
        });
}

export default fetch;