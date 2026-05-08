import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const supabase = getServiceRoleClient();
    
    const { data: message, error } = await supabase
      .from('Message')
      .insert({
        client_id: body.client_id,
        sender_type: body.sender_type ?? 'user',
        content_type: body.content_type ?? 'text',
        text_content: body.text_content ?? '',
        attachment_url: body.attachment_url ?? '',
        platform_timestamp: body.platform_timestamp ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // --- Webhook Trigger Logic ---
    if (body.sender_type === 'agent') {
      try {
        // Fetch client to get details and channel_id
        const { data: client } = await supabase
          .from('Client')
          .select('*')
          .eq('id', body.client_id)
          .single();

        if (client && client.channel_id) {
          // Fetch channel's webhookUrl and full details for n8n
          const { data: channel } = await supabase
            .from('Channel')
            .select('*')
            .eq('id', client.channel_id)
            .single();

          if (channel && channel.webhookUrl && channel.webhookUrl.trim() !== '') {
            // Fire and forget webhook
            fetch(channel.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'message.sent',
                message: message,
                client: client,
                channel: channel,
              }),
            }).catch(err => console.error("Webhook trigger failed:", err));
          }
        }
      } catch (webhookErr) {
        console.error("Error in webhook logic:", webhookErr);
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
