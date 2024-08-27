import { prisma } from "../index";
import { slackClient } from "..";
import { blog } from "../utils/Logger";
import { t } from "../lib/template";

export async function githubHandler(request: Request) {
  const json = await request.json();

  if (
    json.ref !== undefined &&
    json.before !== undefined &&
    json.after !== undefined
  ) {
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
      blog(
        `User ${json.sender.login} added Grolf to ${(
          json.repositories_added as {
            id: number;
            node_id: string;
            name: string;
            full_name: string;
            private: boolean;
          }[]
        )
          .map((repo) => repo.full_name)
          .join(" ")}!`,
        "info"
      );
      return new Response("ok", { status: 200 });
    default:
      blog(
        `Github Handler received unknown action: ${
          json.action
        }\n\n---\nfull json: \n---\n${JSON.stringify(json)}\n---`,
        "error"
      );
      return new Response("ok", { status: 200 });
  }
}

export async function githubWebhookHandler(json: any) {
  const isRelease = (json.ref as string).startsWith("refs/tags/");
  // check if the push is a commit or a release
  if (
    json.pusher.name === "github-actions[bot]" ||
    json.pusher.name === "dependabot[bot]"
  )
    return new Response("ok", { status: 200 });

  if (isRelease) {
    blog(
      `Github Webhook Handler triggered for repo: ${
        json.repository.full_name
      } with tag: \`${(json.ref as string).split("/")[2]}\``,
      "info"
    );
  } else {
    blog(
      `Github Webhook Handler triggered for repo: ${json.repository.full_name} with commit: \`${json.head_commit.id}\``,
      "info"
    );
  }

  // find user in db
  const user = await prisma.users.findFirst({
    where: {
      githubUser: (json.pusher.name as string).trim(),
    },
  });

  if (user && user.installed === 2 && user.threadTS) {
    let arcadeSessionData: {
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
      error?: string;
    };

    try {
      const response = await fetch(
        "https://hackhour.hackclub.com/api/session/" + user.id,
        {
          headers: {
            Authorization: `Key ${process.env.ARCADE_TOKEN}`,
          },
        }
      );

      if (response.ok) {
        arcadeSessionData = await response.json();
      } else {
        throw new Error("Failed to fetch arcade session data");
      }
    } catch (error) {
      blog(
        `Error with the arcade api request for <@${user.id}>: ${error}`,
        "error"
      );
      return new Response("ok", { status: 200 });
    }

    if (!arcadeSessionData.ok) {
      blog(
        `Error with the arcade api request for <@${user.id}>:\nhttps://hackhour.hackclub.com/api/session/${user.id}`,
        "error"
      );
      return new Response("ok", { status: 200 });
    }

    if (
      (!arcadeSessionData.data.completed &&
        arcadeSessionData.data.messageTs === user.threadTS) ||
      user.expireTime.getTime() + 1000 * 60 * 30 > Date.now()
    ) {
      // update expire time
      await prisma.users.update({
        where: {
          githubUser: user.githubUser,
        },
        data: {
          expireTime: arcadeSessionData.data.endTime,
        },
      });

      const normalmessage = t("commit.normal", {
        commit_url: json.head_commit.url,
        repo_url: `<${json.repository.html_url}|${json.repository.full_name}>`,
        commit_message: `\`${(json.head_commit.message as string)
          .split("\n")[0]
          .trim()
          .replaceAll("`", "")}\``,
        user_id: user.id,
      });

      const releaseUrl = `${json.repository.html_url}/releases/tag/${
        (json.ref as string).split("/")[2]
      }`;
      const releasemessage = t("commit.release", {
        release_url: releaseUrl,
        repo_url: `<${json.repository.html_url}|${json.repository.full_name}>`,
        release_tag: (json.ref as string).split("/")[2],
        user_id: user.id,
      });

      // send the commits to the thread
      await slackClient.chat.postMessage({
        channel: "C06SBHMQU8G",
        thread_ts: user.threadTS,
        text: isRelease
          ? `released new version: ${
              (json.ref as string).split("/")[2]
            } ${releaseUrl}`
          : `committed: ${(json.head_commit.message as string)
              .split("\n")[0]
              .trim()
              .replaceAll("`", "")} ${json.head_commit.url}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${isRelease ? releasemessage : normalmessage}`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: isRelease ? releaseUrl : json.head_commit.url,
              },
            ],
          },
        ],
      });

      // update analytics
      const day = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";

      await prisma.analytics.upsert({
        update: {
          totalCommits: { increment: isRelease ? 0 : 1 },
          totalReleases: { increment: isRelease ? 1 : 0 },
        },
        create: {
          day,
          totalCommits: isRelease ? 0 : 1,
          totalReleases: isRelease ? 1 : 0,
        },
        where: {
          day,
        },
      });
    } else {
      blog(
        `Arcade session expired for <@${user.id}>! time till finished: ${
          user.expireTime.getTime() - Date.now()
        }`,
        "error"
      );
    }
  } else {
    blog(
      `No user found / not properly installed for commit: ${json.pusher.name} on ${json.repository.full_name}`,
      "error"
    );
  }
  return new Response("ok", { status: 200 });
}

// installation handler
async function installationHandler(json: any) {
  blog(
    "Installation Handler for user: " + json.installation.account.login,
    "info"
  );
  // find user in db
  const user = await prisma.users.findFirst({
    where: {
      githubUser: (json.installation.account.login as string).trim(),
    },
  });

  if (!user || user.viewID == "") {
    blog(
      `User ${json.installation.account.login} installed Grolf! but not in database yet!`,
      "error"
    );
    return new Response("ok", { status: 200 });
  }

  try {
    await slackClient.views.update({
      view_id: user.viewID!,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "Authentication",
          emoji: true,
        },
        close: {
          type: "plain_text",
          text: "Click ME!",
          emoji: true,
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Thanks for connecting your GitHub account! Grolf will now load this thread into it's memory and start sending you scraps!",
            },
          },
        ],
      },
    });
  } catch (err) {
    blog(err as string, "error");
  }

  await slackClient.chat.postMessage({
    channel: "C06SBHMQU8G",
    thread_ts: user.threadTS,
    text: t("fetch.success", { user_id: user.id }),
  });

  await prisma.users.update({
    where: {
      githubUser: json.installation.account.login,
    },
    data: {
      installed: 2,
    },
  });

  // create a new analytics entry if it doesn't exist
  const day = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";

  await prisma.analytics.upsert({
    update: {
      newUsers: { increment: 1 },
    },
    create: {
      day,
      newUsers: 1,
    },
    where: {
      day,
    },
  });

  return new Response("ok", { status: 200 });
}

async function uninstallationHandler(json: any) {
  blog(
    "Uninstallation Handler for user: " + json.installation.account.login,
    "info"
  );
  // find user in db
  const user = await prisma.users.findFirst({
    where: {
      githubUser: (json.installation.account.login as string).trim(),
    },
  });

  if (user && user.installed == 2) {
    // delete user if found
    await prisma.users.delete({
      where: { githubUser: json.installation.account.login },
    });
    blog(`User ${json.installation.account.login} uninstalled Grolf!`, "info");
  } else {
    blog(
      `User ${json.installation.account.login} tried to uninstalled grolf but was in the onboarding process; skipping`,
      "info"
    );
  }

  return new Response("ok", { status: 200 });
}

const githubHandlerString = "githubHandler";
export default githubHandlerString;
