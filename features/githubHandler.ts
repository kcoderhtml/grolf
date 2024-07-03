import { like } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { slackClient } from "..";
import { blog } from "../utils/Logger";

export async function githubHandler(request: Request) {
    const json = await request.json();
    console.log("Github Handler triggered with action", json.action)

    switch (json.action) {
        case "created":
            return installationHandler(json);
        case "deleted":
            return uninstallationHandler(json);
        default:
            console.log("Github Handler received unknown action", json.action)
            return new Response("ok", { status: 200 });
    }
}

// installation handler
async function installationHandler(json: any) {
    console.log("Installation Handler for user", json.installation.account.login)
    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, json.installation.account.login))

    if (user.length === 0 || user[0].viewID === undefined) {
        // create user
        blog(`User ${json.installation.account.login} installed Grolf! but not in database yet!`, "error")
    }
    await slackClient.views.update({
        view_id: user[0].viewID!,
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
                        text: "Thanks for connecting your GitHub account! Grolf will now load this thread into it's memory and start sending you scraps!"
                    }
                },
            ]
        }
    })

    return new Response("ok", { status: 200 });
}

async function uninstallationHandler(json: any) {
    console.log("Uninstallation Handler for user", json.installation.account.login)
    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, json.installation.account.login))

    if (user.length > 0) { // delete user if found
        await db.delete(schema.users).where(like(schema.users.githubUser, json.installation.account.login)).execute();
    }

    return new Response("ok", { status: 200 });
}

const githubHandlerString = "githubHandler"
export default githubHandlerString