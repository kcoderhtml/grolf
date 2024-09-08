import { slackApp } from '../index'
import { getSettingsMenuBlocks } from './appHome'

const reloadHandler = async () => {
    // listen for action
    slackApp.action('reloadDashboard', async ({ payload, context }) => {
        // get info about the user
        const user = await context.client.users.info({
            user: payload.user.id,
        })

        // check if the user is authorized
        if (
            user.user?.is_owner ||
            user.user?.is_admin ||
            process.env.ADMINS?.split(',').includes(user.user?.id!)
        ) {
            console.log(
                '📥 User is an authorized admin, showing the settings page',
                user.user!.name
            )

            // update the home tab
            await context.client.views.publish({
                user_id: payload.user.id,
                view: {
                    type: 'home',
                    blocks: await getSettingsMenuBlocks(true, payload.user.id),
                },
            })
            return
        } else {
            console.log(
                '📥 User is not an admin showing the analytics page',
                user.user!.name
            )
            // update the home tab
            await context.client.views.publish({
                user_id: payload.user.id,
                view: {
                    type: 'home',
                    blocks: await getSettingsMenuBlocks(false, payload.user.id),
                },
            })
            return
        }
    })
}

export default reloadHandler
