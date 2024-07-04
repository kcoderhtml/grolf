import { like } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { slackClient } from "..";
import { blog } from "../utils/Logger";

export async function githubHandler(request: Request) {
    const json = await request.json();
    console.log("Github Handler triggered with action", json.action)

    if (json.ref !== undefined && json.before !== undefined && json.after !== undefined) {
        return await githubWebhookHandler(json);
    }
    switch (json.action) {
        case "created":
            return installationHandler(json);
        case "deleted":
            return uninstallationHandler(json);
        default:
            console.log("Github Handler received unknown action", json.action, json)
            return new Response("ok", { status: 200 });
    }
}

export async function githubWebhookHandler(json: any) {
    console.log("Github Webhook Handler triggered for repo", json.repository.full_name)

    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, (json.pusher.name as string).trim()))

    if (user.length !== 0 && user[0].installed === 2 && user[0].threadTS && (user[0].expireTime! - Date.now()) > 0) {
        console.log("Sending commit to thread:", user[0].threadTS)
        // send the commits to the thread
        await slackClient.chat.postMessage({
            channel: "C06SBHMQU8G",
            thread_ts: user[0].threadTS!,
            text: (json.head_commit.message as string).split("\n")[0].trim().replaceAll("`", ""),
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `<${json.head_commit.url}|${json.pusher.name} committed \`${(json.head_commit.message as string).split("\n")[0].trim().replaceAll("`", "")}\`> on <${json.repository.html_url}|${json.repository.full_name}>`
                    }
                }
            ]
        })
    } else {
        blog(`No user found for commit: ${json.pusher.name} on ${json.repository.full_name} or arcade session expired! time till finished: ${user[0].expireTime! - Date.now()}`, "error")
    }
    return new Response("ok", { status: 200 });
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

    await db.update(schema.users).set({ installed: 2 }).where(like(schema.users.userID, json.installation.account.login)).execute();

    return new Response("ok", { status: 200 });
}

async function uninstallationHandler(json: any) {
    console.log("Uninstallation Handler for user", json.installation.account.login)
    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, json.installation.account.login))

    if (user.length > 0 && user[0].installed === 2) { // delete user if found
        await db.delete(schema.users).where(like(schema.users.githubUser, json.installation.account.login)).execute();
    }

    return new Response("ok", { status: 200 });
}

const githubHandlerString = "githubHandler"
export default githubHandlerString