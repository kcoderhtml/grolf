import { like } from "drizzle-orm";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { slackClient } from "..";
import { blog } from "../utils/Logger";
import { t } from "../lib/template";

export async function githubHandler(request: Request) {
    const json = await request.json();

    if (json.ref !== undefined && json.before !== undefined && json.after !== undefined) {
        if (json.after !== "0000000000000000000000000000000000000000") {
            return await githubWebhookHandler(json);
        } else {
            return new Response("ok", { status: 200 });
        }
    }

    switch (json.action) {
        case "created":
            return installationHandler(json);
        case "deleted":
            return uninstallationHandler(json);
        case "added":
            blog(`User ${json.sender.login} added Grolf to ${json.repository.full_name}!`, "info")
            return new Response("ok", { status: 200 });
        default:
            blog(`Github Handler received unknown action: ${json.action}\n\n---\nfull json: \n---\n${JSON.stringify(json)}\n---`, "error")
            return new Response("ok", { status: 200 });
    }
}

export async function githubWebhookHandler(json: any) {
    // check if the push is a commit or a release
    if ((json.ref as string).startsWith("refs/tags/")) {
        blog(`Github Webhook Handler triggered for repo: ${json.repository.full_name} with tag: \`${(json.ref as string).split("/")[2]}\``, "info")
    } else {
        blog(`Github Webhook Handler triggered for repo: ${json.repository.full_name} with commit: \`${json.head_commit.id}\``, "info")
    }

    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, (json.pusher.name as string).trim()))

    if (user.length !== 0 && user[0].installed === 2 && user[0].threadTS) {
        if (user[0].expireTime! > Date.now()) {
            const normalmessage = t("commit.normal", { commit_url: json.head_commit.url, repo_url: `<${json.repository.html_url}|${json.repository.full_name}>`, commit_message: `\`${(json.head_commit.message as string).split("\n")[0].trim().replaceAll("`", "")}\``, user_id: user[0].userID! })
            const releasemessage = `<${json.repository.html_url}/releases/tag/${(json.ref as string).split("/")[2]}|${json.pusher.name} released new version:> ${(json.ref as string).split("/")[2]} on <${json.repository.html_url}|${json.repository.full_name}>`

            // send the commits to the thread
            await slackClient.chat.postMessage({
                channel: "C06SBHMQU8G",
                thread_ts: user[0].threadTS!,
                text: (json.ref as string).startsWith("refs/tags/") ? `released new version: ` : `committed: ${(json.head_commit.message as string).split("\n")[0].trim().replaceAll("`", "")}`,
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `${(json.ref as string).startsWith("refs/tags/") ? releasemessage : normalmessage}`
                        }
                    }
                ]
            })
        } else {
            blog(`Arcade session expired for <@${user[0].userID}>! time till finished: ${user[0].expireTime! - Date.now()}`, "error")
        }
    } else {
        blog(`No user found / not properly installed for commit: ${json.pusher.name} on ${json.repository.full_name}`, "error")
    }
    return new Response("ok", { status: 200 });
}

// installation handler
async function installationHandler(json: any) {
    blog("Installation Handler for user: " + json.installation.account.login, "info")
    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, json.installation.account.login))

    if (user.length === 0 || user[0].viewID === undefined) {
        blog(`User ${json.installation.account.login} installed Grolf! but not in database yet!`, "error")
        return new Response("ok", { status: 200 });
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

    await db.update(schema.users).set({ installed: 2 }).where(like(schema.users.githubUser, json.installation.account.login)).execute();

    return new Response("ok", { status: 200 });
}

async function uninstallationHandler(json: any) {
    blog("Uninstallation Handler for user: " + json.installation.account.login, "info")
    // find user in db
    const user = await db.select().from(schema.users).where(like(schema.users.githubUser, json.installation.account.login))

    if (user.length > 0 && user[0].installed === 2) { // delete user if found
        await db.delete(schema.users).where(like(schema.users.githubUser, json.installation.account.login)).execute();
        blog(`User ${json.installation.account.login} uninstalled Grolf!`, "info")
    }

    return new Response("ok", { status: 200 });
}

const githubHandlerString = "githubHandler"
export default githubHandlerString