import { slackApp } from "../index";
import { db } from "../db/index";
import * as schema from "../db/schema";

import { t } from "../lib/template";
import clog from "../utils/Logger";
import { like } from "drizzle-orm";

const fetchHandler = async (
) => {
    // listen for shortcut
    slackApp.action("fetchGithub", async ({ payload, context }) => {
        // @ts-expect-error
        clog(`User ${payload.user.id} triggered fetchGithub action with the username of: ${payload.actions[0].value}`, "info");

        console.log(payload.response_url)
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
                            text: "You submitted the fetchGithub view! Now you need to authenticate yourself with your GitHub account."
                        }
                    }
                ]
            }
        })
    });
}

export default fetchHandler