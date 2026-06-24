import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET /api/dashboard - Dashboard stats
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = getServiceRoleClient();
    
    // Fetch all data in parallel
    const [
      { data: channels },
      { data: products },
      { data: bookings },
      { data: clients },
    ] = await Promise.all([
      supabase.from('Channel').select('*'),
      supabase.from('Product').select('*'),
      supabase.from('Booking').select('*, client:Client(*)'),
      supabase.from('Client').select('*, Message(id, platform_timestamp)'),
    ]);

    const safeChannels = channels || [];
    const safeBookings = bookings || [];
    const safeClients = clients || [];
    const safeProducts = products || [];

    const activeChannels = safeChannels.filter(c => c.isActive).length;
    const totalBookings = safeBookings.length;
    const pendingBookings = safeBookings.filter(b => b.status === 'pending').length;
    const confirmedBookings = safeBookings.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = safeBookings.filter(b => b.status === 'cancelled').length;

    // channelPerformanceData
    const channelPerformanceData = [
      { channel: "WhatsApp", channelAr: "واتساب", messages: 0 },
      { channel: "Facebook", channelAr: "فيسبوك", messages: 0 },
      { channel: "Instagram", channelAr: "انستجرام", messages: 0 },
    ];

    let totalMessages = 0;
    let activeConversations = 0;

    safeClients.forEach(client => {
      const msgs = client.Message || [];
      const count = Array.isArray(msgs) ? msgs.length : 0;
      totalMessages += count;

      if (client.status === 'active') {
        activeConversations++;
      }

      const cType = (client.platform || "").toLowerCase();
      if (cType.includes("whatsapp")) channelPerformanceData[0].messages += count;
      else if (cType.includes("facebook") || cType.includes("messenger")) channelPerformanceData[1].messages += count;
      else if (cType.includes("instagram")) channelPerformanceData[2].messages += count;
    });

    // conversionRate - calculate based on total bookings vs clients with messages
    const clientsWithMessages = safeClients.filter(c => c.Message && c.Message.length > 0).length;
    const conversionRate = clientsWithMessages > 0
      ? Number(((totalBookings / clientsWithMessages) * 100).toFixed(1))
      : 0;

    // recentBookings
    const recentBookings = [...safeBookings]
      .sort((a, b) => new Date(b.bookingDate || b.createdAt).getTime() - new Date(a.bookingDate || a.createdAt).getTime())
      .slice(0, 5)
      .map(b => {
        let channelAr = b.channelType;
        const cType = (b.channelType || "").toLowerCase();
        if (cType.includes("whatsapp")) channelAr = "واتساب";
        else if (cType.includes("facebook") || cType.includes("messenger")) channelAr = "فيسبوك";
        else if (cType.includes("instagram")) channelAr = "انستجرام";
        else if (cType.includes("manual")) channelAr = "يدوي";
        else if (cType.includes("website")) channelAr = "الموقع";

        return {
          id: b.id,
          clientName: (b as any).client?.name || 'Unknown',
          clientNameAr: (b as any).client?.name || 'Unknown', // Fallback if no AR name
          service: b.serviceSummary,
          serviceAr: b.serviceSummary,
          channel: b.channelType,
          channelAr: channelAr,
          date: new Date(b.bookingDate || b.createdAt).toISOString().split('T')[0],
          status: b.status || "pending"
        };
      });

    // weeklyTrendData (last 7 days)
    const weeklyTrendData: any[] = [];
    const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const daysAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayEn = daysEn[d.getDay()];
      const dayAr = daysAr[d.getDay()];

      // Count messages for this day by looking at platform_timestamp
      let msgsToday = 0;
      safeClients.forEach(client => {
        const msgs = client.Message || [];
        msgs.forEach((m: any) => {
          if (m.platform_timestamp && new Date(m.platform_timestamp).toISOString().startsWith(dayStr)) {
            msgsToday++;
          }
        });
      });
      
      const booksToday = safeBookings.filter(b => (b.bookingDate || b.createdAt).startsWith(dayStr)).length;

      weeklyTrendData.push({
        day: dayEn,
        dayAr: dayAr,
        messages: msgsToday,
        bookings: booksToday
      });
    }

    // Blacklist count is now represented by ai_enabled === false
    const blacklistCount = safeClients.filter(c => c.ai_enabled === false).length;

    return NextResponse.json({
      activeChannels,
      totalChannels: safeChannels.length,
      totalMessages, 
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      conversionRate,
      totalClients: safeClients.length,
      totalProducts: safeProducts.length,
      blacklistCount,
      activeConversations,
      channelPerformanceData,
      recentBookings,
      weeklyTrendData
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
