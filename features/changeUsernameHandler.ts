import { slackApp, prisma } from "../index";

import clog from "../utils/Logger";
import { t } from "../lib/template";

const changeUsernameHandler = async () => {
  // listen for shortcut
  slackApp.action(
    "changeUsername",
    async () => {},
    async ({ payload, context }) => {
      clog(
        // @ts-expect-error
        `User ${payload.user.id} triggered fetchGithub action with the username of: ${payload.actions[0].value}`,
        "info"
      );

      await context.client.views.update({
        view_id: payload.view!.id,
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

      await prisma.users.update({
        where: { id: payload.user.id },
        data: {
          // @ts-expect-error
          githubUser: payload.actions[0].value,
          installed: 1,
          viewID: payload.view!.id,
        },
      });
    }
  );
};

export default changeUsernameHandler;
