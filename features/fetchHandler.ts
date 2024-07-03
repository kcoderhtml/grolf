import { slackApp } from "../index";
import { db } from "../db/index";
import * as schema from "../db/schema";

import { t } from "../lib/template";
import clog from "../utils/Logger";
import { like } from "drizzle-orm";

const fetchHandler = async (
) => {
    // listen for shortcut
    slackApp.action("fetchGithub", async () => { }, async ({ payload, context }) => {
        // @ts-expect-error
        clog(`User ${payload.user.id} triggered fetchGithub action with the username of: ${payload.actions[0].value}`, "info");

        // check if user is already in db
        // @ts-expect-error
        const user = await db.select().from(schema.users).where(like(schema.users.githubUser, payload.actions[0].value))
        if (user.length === 0 || user[0].installed === 0) {
            await context.client.views.update({
                view_id: payload.view!.id,
                view: {
                    type: "modal",
                    title: {
                        type: "plain_text",
                        text: "Authentication",
                        emoji: true
                    },
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "Thanks for entering your GitHub username! Please click <https://github.com/apps/grolf-s-github-personality|here to connect your GitHub account> to continue."
                            }
                        },
                    ]
                }
            })

            // get user name
            const user = await context.client.users.info({ user: payload.user.id })
            // @ts-expect-error
            await db.insert(schema.users).values({ userName: user.user!.name, userID: payload.user.id, viewID: payload.view!.id, githubUser: payload.actions[0].value, installed: 0 }).execute();
        } else {
            await context.client.views.update({
                view_id: payload.view!.id,
                view: {
                    type: "modal",
                    title: {
                        type: "plain_text",
                        text: "Authentication",
                        emoji: true
                    },
                    close: {
                        type: "plain_text",
                        text: "All done!",
                        emoji: true
                    },
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: "You are already connected to GitHub! Loading this thread into Grolf..."
                            }
                        },
                    ]
                }
            })
        }
    })
}

export default fetchHandler