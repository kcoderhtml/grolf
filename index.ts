import { SlackApp } from "slack-edge";
import { slog, clog, blog } from "./utils/Logger";

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

blog(`🚀 Server Started in ${Bun.nanoseconds() / 1000000} milliseconds on version: ${version}!`, "start")
console.log("\n----------------------------------\n")

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
            default:
                return new Response("404 Not Found", { status: 404 });
        }
    },
};

export { slackApp, slackClient };
