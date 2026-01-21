// Slack Service - Notificaciones internas
// Implementa SRP: Solo manejo de notificaciones Slack

import { Call } from '@/shared/types/schema';

export interface ISlackService {
  sendCallNotification(call: Call): Promise<void>;
  sendAlert(message: string, severity?: 'info' | 'warning' | 'error'): Promise<void>;
}

export class SlackService implements ISlackService {
  private webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  /**
   * Envía notificación de llamada a Slack
   */
  async sendCallNotification(call: Call): Promise<void> {
    if (!this.webhookUrl) {
      console.log('🔕 Slack webhook not configured, skipping notification');
      return;
    }

    try {
      const color = call.status === 'missed' ? '#FF5252' : '#4CAF50';
      const emoji = call.status === 'missed' ? '📵' : '📞';

      const payload = {
        attachments: [
          {
            color,
            title: `${emoji} ${call.status === 'missed' ? 'Llamada Perdida' : 'Llamada Recibida'}`,
            fields: [
              {
                title: 'Número',
                value: call.callerNumber,
                short: true,
              },
              {
                title: 'Estado',
                value: call.status,
                short: true,
              },
              {
                title: 'Duración',
                value: call.duration ? `${call.duration}s` : 'N/A',
                short: true,
              },
              {
                title: 'Tipo',
                value: call.callType || 'direct',
                short: true,
              },
              {
                title: 'Ubicación',
                value: call.routedToLocation?.toString() || 'N/A',
                short: true,
              },
              {
                title: 'Hora',
                value: new Date(call.createdAt).toLocaleString('es-ES'),
                short: true,
              },
            ],
            footer: 'UNMI Call Tracking',
            ts: Math.floor(new Date(call.createdAt).getTime() / 1000),
          },
        ],
      };

      await this.sendSlackMessage(payload);
    } catch (error) {
      console.error('Error sending call notification to Slack:', error);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }

  /**
   * Envía alerta genérica a Slack
   */
  async sendAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    if (!this.webhookUrl) {
      console.log('🔕 Slack webhook not configured, skipping alert');
      return;
    }

    const colorMap = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
    };

    const emojiMap = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨',
    };

    const payload = {
      attachments: [
        {
          color: colorMap[severity],
          title: `${emojiMap[severity]} ${severity.toUpperCase()}`,
          text: message,
          footer: 'UNMI System Alert',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      await this.sendSlackMessage(payload);
    } catch (error) {
      console.error('Error sending alert to Slack:', error);
    }
  }

  /**
   * Envía mensaje a Slack webhook
   * @private
   */
  private async sendSlackMessage(payload: any): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }
  }
}

export const slackService = new SlackService();



