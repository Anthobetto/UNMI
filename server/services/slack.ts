import { WebClient } from "@slack/web-api";
import { Call, Message } from "@shared/schema";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

let slack: WebClient | undefined;

export async function initializeSlack() {
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
    console.warn('Slack credentials not configured. Notifications will be logged to console.');
    return false;
  }

  slack = new WebClient(SLACK_BOT_TOKEN);
  return true;
}

export async function sendCallNotification(call: Call) {
  if (!slack || !SLACK_CHANNEL_ID) {
    console.log('Simulating Slack notification for call:', call);
    return;
  }

  try {
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New ${call.status} Call*`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*From:*\n${call.callerNumber}`
            },
            {
              type: "mrkdwn",
              text: `*Duration:*\n${call.duration || 0}s`
            },
            {
              type: "mrkdwn",
              text: `*Status:*\n${call.status}`
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

export async function sendMessageNotification(message: Message) {
  if (!slack || !SLACK_CHANNEL_ID) {
    console.log('Simulating Slack notification for message:', message);
    return;
  }

  try {
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New ${message.type} Message*`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*To:*\n${message.recipient}`
            },
            {
              type: "mrkdwn",
              text: `*Status:*\n${message.status}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: message.content
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}