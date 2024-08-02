import { getEnabled, slackApp, prisma } from "../index";

import { blog } from "../utils/Logger";
import type { AnyHomeTabBlock } from "slack-edge";
import barChartGenerator from "../lib/barChart";

const appHome = async (
) => {
    // listen for shortcut
    slackApp.event("app_home_opened", async ({ payload, context }) => {
        // check if its opening the home tab
        if (payload.tab !== "home") {
            return;
        }

        // get info about the user
        const user = await context.client.users.info({
            user: payload.user,
        });

        // check if the user is authorized
        if (
            user.user?.is_owner ||
            user.user?.is_admin ||
            process.env.ADMINS?.split(",").includes(user.user?.id!)
        ) {
            // update the home tab
            await context.client.views.publish({
                user_id: payload.user,
                view: {
                    type: "home",
                    blocks: await getSettingsMenuBlocks(true, payload.user),
                },
            });
            return;
        } else {
            console.log("📥 User is not authorized", user.user!.name);
            // update the home tab
            await context.client.views.publish({
                user_id: payload.user,
                view: {
                    type: "home",
                    blocks: await getSettingsMenuBlocks(false, payload.user),
                },
            });
            return;
        }
    }
    );
}

export default appHome;

export async function getSettingsMenuBlocks(
    allowed: boolean,
    user: string,
): Promise<AnyHomeTabBlock[]> {
    const analytics = (await prisma.analytics.findMany()).sort((a, b) => b.day!.getTime() - a.day!.getTime());
    const users = await prisma.users.findMany()
    const enabled = getEnabled();

    if (!allowed) {
        blog(`User <@${user}> is not an admin so they are not authorized to change any settings but plz enjoy the analytics!`, "info");
        return [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:gear: Grolf's Lair :gear:`,
                },
            },
            {
                type: "divider",
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:siren-real: You are not an admin so you are not authorized to change any settings but plz enjoy the analytics!`,
                },
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:blobby-bar_chart: Analytics:\n\nTotal Users: ${users.length}`,
                },
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `Commits Sent Over the Last 5 Days:\n\n${barChartGenerator(
                        analytics.slice(0, 5).map((analytics) => analytics.totalCommits!), 5,
                        analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                            weekday: "short",
                        })),
                    )}`
                },
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `New Releases Sent Over the Last 5 Days:\n\n${barChartGenerator(
                        analytics.slice(0, 5).map((analytics) => analytics.totalReleases!), 5,
                        analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                            weekday: "short",
                        })),
                    )}`
                },
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `New Users Over the Last 5 Days:\n\n${barChartGenerator(
                        analytics.slice(0, 5).map((analytics) => analytics.newUsers!), 5,
                        analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                            weekday: "short",
                        })),
                    )}`
                },
            },
            {
                type: "divider",
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `:blobby-admission_tickets: Admins: \n\n${process.env.ADMINS?.split(
                        ",",
                    )
                        .map((admin) => `<@${admin}>`)
                        .join(" ")}`,
                },
            },
            {
                type: "divider",
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Reload Dashboard",
                            emoji: true,
                        },
                        action_id: "reloadDashboard",
                    },
                ],
            }
        ];
    }

    // update the home tab
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:gear: Grolf's Lair :gear:`,
            },
        },
        {
            type: "divider",
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:neocat_happy: App status: ${enabled ? ":white_check_mark:" : ":x:"}`,
            },
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text:
                            "Toggle App Status to " +
                            (!enabled
                                ? ":white_check_mark:"
                                : ":x:"),
                        emoji: true,
                    },
                    action_id: "toggleEnabled",
                },
            ],
        },
        {
            type: "divider",
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:blobby-bar_chart: Analytics:\n\nTotal Users: ${users.length}`,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `Commits Sent Over the Last 5 Days:\n\n${barChartGenerator(
                    analytics.slice(0, 5).map((analytics) => analytics.totalCommits!), 5,
                    analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                        weekday: "short",
                    })),
                )}`
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `New Releases Sent Over the Last 5 Days:\n\n${barChartGenerator(
                    analytics.slice(0, 5).map((analytics) => analytics.totalReleases!), 5,
                    analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                        weekday: "short",
                    })),
                )}`
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `New Users Over the Last 5 Days:\n\n${barChartGenerator(
                    analytics.slice(0, 5).map((analytics) => analytics.newUsers!), 5,
                    analytics.slice(0, 5).map((analytics) => new Date(analytics.day!).toLocaleDateString("en-US", {
                        weekday: "short",
                    })),
                )}`
            },
        },
        {
            type: "divider",
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:blobby-admission_tickets: Admins: \n\n${process.env.ADMINS?.split(
                    ",",
                )
                    .map((admin) => `<@${admin}>`)
                    .join(" ")}`,
            },
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `:blobby-imp: Users: \n\n${users.map((user) => `<@${user.id}>`).join(" ")}`,
            },
        },
        {
            type: "divider",
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Reload Dashboard",
                        emoji: true,
                    },
                    action_id: "reloadDashboard",
                },
            ],
        }
    ];
}
