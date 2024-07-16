import { slackApp, getEnabled, updateEnabled } from "../index";
import { getSettingsMenuBlocks } from "./appHome";

const reloadHandler = async (
) => {
    // listen for action
    slackApp.action("toggleEnabled", async ({ payload, context }) => {
        // get info about the user
        const user = await context.client.users.info({
            user: payload.user.id,
        });

        // check if the user is authorized
        if (
            user.user?.is_owner ||
            user.user?.is_admin ||
            process.env.ADMINS?.split(",").includes(user.user?.id!)
        ) {
            console.log("📥 User is authorized to toggle the app status", user.user!.name);

            updateEnabled(!getEnabled());

            // update the home tab
            await context.client.views.publish({
                user_id: payload.user.id,
                view: {
                    type: "home",
                    blocks: await getSettingsMenuBlocks(true, payload.user.id),
                },
            });
            return;
        } else {
            console.log("📥 User is not authorized", user.user!.name);
            // update the home tab
            await context.client.views.publish({
                user_id: payload.user.id,
                view: {
                    type: "home",
                    blocks: await getSettingsMenuBlocks(false, payload.user.id),
                },
            });
            return;
        }
    });
}

export default reloadHandler;