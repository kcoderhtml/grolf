import { getEnabled, slackApp, prisma } from "../index";

import { t } from "../lib/template";
import { clog } from "../utils/Logger";
import { like } from "drizzle-orm";

const fetchAction = async () => {
  // listen for shortcut
  slackApp.shortcut(
    "fetch",
    async () => {},
    async ({ context, payload }) => {
      // first check if the message is in the arcade channel
      if (
        context.channelId !== "C06SBHMQU8G" ||
        // @ts-expect-error
        payload.message.bot_id !== "B077ZPZ3RB7"
      ) {
        clog(
          // @ts-expect-error
          `User tried to fetch data in wrong channel: ${payload.message.channel} or bot: ${payload.message.bot_id}`,
          "error"
        );
        return;
      }

      if (!getEnabled()) {
        // send the disabled message
        await context.client.views.open({
          trigger_id: payload.trigger_id,
          view: {
            type: "modal",
            title: {
              type: "plain_text",
              text: "Bibity bye bye!",
              emoji: true,
            },
            close: {
              type: "plain_text",
              text: "Shoo shoo",
              emoji: true,
            },
            blocks: [
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: t("fetch.disabled", { user_id: payload.user.id }),
                  },
                ],
              },
            ],
          },
        });
        return;
      }

      // check if user is in db
      const user = await prisma.users.findFirst({
        where: {
          id: payload.user.id,
        },
      });

      const arcadeSessionData: {
        ok: boolean;
        data: {
          id: string;
          createdAt: Date;
          time: number;
          elapsed: number;
          remaining: number;
          endTime: Date;
          paused: boolean;
          completed: boolean;
          goal: string;
          work: string;
          messageTs: string;
        };
      } = await fetch(
        "https://hackhour.hackclub.com/api/session/" + payload.user.id,
        {
          headers: {
            Authorization: `Bearer ${process.env.ARCADE_TOKEN}`,
          },
        }
      ).then((res) => res.json());

      if (arcadeSessionData.ok || !arcadeSessionData.data.completed) {
        if (!user || user.githubUser == undefined) {
          clog(`User not found in DB: ${payload.user.id}`, "error");

          const user = await context.client.users.info({
            user: payload.user.id,
          });
          await prisma.users.create({
            data: {
              userName: user.user!.name!,
              id: payload.user.id,
              installed: 0,
              // @ts-expect-error
              threadTS: payload.message.thread_ts,
              expireTime: arcadeSessionData.data.endTime,
              arcadeSessionDone: arcadeSessionData.data.completed,
            },
          });

          // send a view to the user
          await context.client.views.open({
            trigger_id: payload.trigger_id,
            view: {
              type: "modal",
              title: {
                type: "plain_text",
                text: "Loggity Log into GityHub",
                emoji: true,
              },
              close: {
                type: "plain_text",
                text: "Cancel (grolf sad)",
                emoji: true,
              },
              blocks: [
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: t("fetch.not_found", { user_id: payload.user.id }),
                    },
                  ],
                },
                { type: "divider" },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: "Can you please enter your :github: user name? my friends :octocat: and :grolf-bg: need it to send your git scraps yourway",
                  },
                },
                {
                  dispatch_action: true,
                  type: "input",
                  element: {
                    type: "plain_text_input",
                    action_id: "fetchGithub",
                    placeholder: {
                      type: "plain_text",
                      text: "Enter your :beautiful: user name",
                      emoji: true,
                    },
                  },
                  label: {
                    type: "plain_text",
                    text: "Your Username",
                  },
                },
              ],
            },
          });
          return;
        } else if (user.installed != 2) {
          await context.client.views.open({
            trigger_id: payload.trigger_id,
            view: {
              type: "modal",
              title: {
                type: "plain_text",
                text: "Loggity Log into GityHub",
                emoji: true,
              },
              close: {
                type: "plain_text",
                text: "Cancel (grolf sad)",
                emoji: true,
              },
              blocks: [
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: t("fetch.not_found", { user_id: payload.user.id }),
                    },
                  ],
                },
                { type: "divider" },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `You already entered your username as \`${user.githubUser}\` but you still need to log in to github`,
                  },
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Sign in with Github",
                        emoji: true,
                      },
                      action_id: "fetchGithub",
                      value: user.githubUser,
                    },
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Change Username",
                        emoji: true,
                      },
                      action_id: "changeUsername",
                    },
                  ],
                },
              ],
            },
          });
        } else {
          // update thread ts
          await prisma.users.update({
            where: {
              id: payload.user.id,
            },
            data: {
              // @ts-expect-error
              threadTS: payload.message.thread_ts,
              expireTime: arcadeSessionData.data.endTime,
              arcadeSessionDone: arcadeSessionData.data.completed,
            },
          });

          // send a message in the thread
          await context.client.chat.postMessage({
            // @ts-expect-error
            channel: payload.channel.id,
            // @ts-expect-error
            thread_ts: payload.message.thread_ts,
            text: t("fetch.success", { user_id: payload.user.id }),
          });
        }
      } else {
        clog(`User's arcade session is over: ${payload.user.id}`, "info");
        // send a view to the user
        await context.client.views.open({
          trigger_id: payload.trigger_id,
          view: {
            type: "modal",
            title: {
              type: "plain_text",
              text: "make grolf sad :(",
              emoji: true,
            },
            close: {
              type: "plain_text",
              text: "Cancel (grolf sad)",
              emoji: true,
            },
            blocks: [
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: t("fetch.expired", { user_id: payload.user.id }),
                  },
                ],
              },
              { type: "divider" },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "plz do select a proper session",
                },
              },
            ],
          },
        });
      }
    }
  );
};

export default fetchAction;
