import { SlackApp } from "slack-edge";
import { blog } from "./utils/Logger";
import { t } from "./lib/template";

import * as features from "./features/index";

import { db } from "./db/index";
import * as schema from "./db/schema";
import { githubHandler, githubWebhookHandler } from "./features/githubHandler";
import { like } from "drizzle-orm";

const version = require('./package.json').version

console.log("----------------------------------\nGrolf Server\n----------------------------------\n")
console.log("🏗️  Starting ABOT...");
console.log("📦 Loading Slack App...")
console.log("🔑 Loading environment variables...")

// do loading stuff here
const slackApp = new SlackApp({
    env: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
        SLACK_LOGGING_LEVEL: "INFO",
    },
    startLazyListenerAfterAck: true
});
const slackClient = slackApp.client;

console.log(`⚒️  Loading ${Object.entries(features).length} features...`);
for (const [feature, handler] of Object.entries(features)) {
    console.log(`📦 ${feature} loaded`);
    if (typeof handler === "function") {
        handler();
    }
}

// loading db
console.log(`⛁  Loading DB...`);
const users = await db.select().from(schema.users).all();
console.log(`👥 Loaded ${users.length} users`);

let enabled = true;

// check the db for enabled
const existingSetting = await db.select().from(schema.settings).where(like(schema.settings.setting, "enabled")).execute();
if (existingSetting && existingSetting.length > 0) {
    enabled = existingSetting[0].boolean === 1 ? true : false;
}

async function updateEnabled(value: boolean) {
    enabled = value;

    // update the settings
    const existingSetting = await db.select().from(schema.settings).where(like(schema.settings.setting, "enabled")).execute();

    if (existingSetting) {
        console.log("📥 Updating enabled setting to", value);
        await db.update(schema.settings).set({ boolean: value ? 1 : 0 }).where(like(schema.settings.setting, "enabled")).execute();
    } else {
        console.log("📥 Inserting enabled setting to", value);
        await db.insert(schema.settings).values({ setting: "enabled", boolean: value ? 1 : 0 }).execute();
    }
}

function getEnabled() {
    return enabled;
}

console.log(`🚀 Server Started in ${Bun.nanoseconds() / 1000000} milliseconds on version: ${version}!\n\n----------------------------------\n`,)

blog(t("app.startup", {
    environment: process.env.NODE_ENV
}), "start")

console.log()

// run main app here
export default {
    port: 3000,
    async fetch(request: Request) {
        const url = new URL(request.url);
        const path = url.pathname;

        switch (path) {
            case "/":
                return new Response("Hello World!");
            case "/health":
                return new Response("OK");
            case "/slack":
                return slackApp.run(request);
            case "/gh":
                return await githubHandler(request);
            default:
                return new Response("404 Not Found", { status: 404 });
        }
    },
};

export { slackApp, slackClient, getEnabled, updateEnabled };
