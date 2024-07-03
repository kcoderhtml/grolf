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

        // @ts-expect-error
        await db.update(schema.users).set({ githubUser: payload.actions[0].value, installed: 1 }).where(like(schema.users.userID, payload.user.id)).execute();
    })
}

export default fetchHandler