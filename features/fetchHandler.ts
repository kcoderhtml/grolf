import { slackApp, prisma } from '../index'

import clog from '../utils/Logger'

const fetchHandler = async () => {
    // listen for shortcut
    slackApp.action(
        'fetchGithub',
        async () => {},
        async ({ payload, context }) => {
            clog(
                // @ts-expect-error
                `User ${payload.user.id} triggered fetchGithub action with the username of: ${payload.actions[0].value}`,
                'info'
            )

            await context.client.views.update({
                view_id: payload.view!.id,
                view: {
                    type: 'modal',
                    title: {
                        type: 'plain_text',
                        text: 'Authentication',
                        emoji: true,
                    },
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                // @ts-expect-error
                                text: `Thanks for entering your GitHub username  \`${payload.actions[0].value}\`! Please click <https://github.com/apps/grolf-s-github-personality|here to connect your GitHub account> to continue.`,
                            },
                        },
                        {
                            type: 'context',
                            elements: [
                                {
                                    type: 'plain_text',
                                    text: 'alternatively if you spelled your username wrong click the button to change it',
                                },
                            ],
                        },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    text: {
                                        type: 'plain_text',
                                        text: 'Change Username',
                                        emoji: true,
                                    },
                                    action_id: 'changeUsername',
                                },
                            ],
                        },
                    ],
                },
            })

            await prisma.users.update({
                where: { id: payload.user.id },
                data: {
                    // @ts-expect-error
                    githubUser: payload.actions[0].value,
                    installed: 1,
                    viewID: payload.view!.id,
                },
            })
        }
    )
}

export default fetchHandler
