import { slackClient } from '../index'

import Bottleneck from 'bottleneck'
import Queue from './queue'

import colors from 'colors'
import type {
    ChatPostMessageRequest,
    ChatPostMessageResponse,
} from 'slack-edge'

// Create a rate limiter with Bottleneck
const limiter = new Bottleneck({
    minTime: 1000, // 1 second between each request
})

const messageQueue = new Queue()

function sendMessage(
    message: ChatPostMessageRequest
): Promise<ChatPostMessageResponse> {
    return limiter.schedule(() => slackClient.chat.postMessage(message))
}

async function slog(
    logMessage: string,
    location?: {
        thread_ts?: string
        channel: string
    }
) {
    const message: ChatPostMessageRequest = {
        channel: location?.channel || process.env.SLACK_LOG_CHANNEL!,
        thread_ts: location?.thread_ts,
        text: logMessage.substring(0, 2500),
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: logMessage
                        .split('\n')
                        .map((a) => `> ${a}`)
                        .join('\n'),
                },
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `${new Date().toString()}`,
                    },
                ],
            },
        ],
    }

    messageQueue.enqueue(() => sendMessage(message))
}

type LogType = 'info' | 'start' | 'cron' | 'error'

export const clog = async (logMessage: string, type: LogType) => {
    switch (type) {
        case 'info':
            console.log(colors.blue(logMessage))
            break
        case 'start':
            console.log(colors.green(logMessage))
            break
        case 'cron':
            console.log(colors.magenta(`[CRON]: ${logMessage}`))
            break
        case 'error':
            console.error(
                colors.red.bold(
                    `Yo <@S0790GPRA48> deres an error \n\n [ERROR]: ${logMessage}`
                )
            )
            break
        default:
            console.log(logMessage)
    }
}

export const blog = async (
    logMessage: string,
    type: LogType,
    location?: {
        thread_ts?: string
        channel: string
    }
) => {
    slog(logMessage, location)
    clog(logMessage, type)
}

export { clog as default, slog }
