import { slackApp } from "../index";
import { t } from "../lib/template";
import { blog, clog } from "../utils/Logger";

const fetch = async (
) => {
    // listen for shortcut
    slackApp.shortcut("fetch", async () => { },
        async ({ payload }) => {
            const { user } = payload;

            blog(t("fetch.start", {
                user_id: user.id
            }), "info", {
                // @ts-expect-error
                thread_ts: payload.message.ts,
                // @ts-expect-error
                channel: payload.channel.id
            });
        });
}

export default fetch;