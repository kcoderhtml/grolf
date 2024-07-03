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
            }

            clog(`User found in DB: ${payload.user.id}`, "info");
        });
}

export default fetch;