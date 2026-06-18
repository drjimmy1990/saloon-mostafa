const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://havgzkklfiengdxsyqmf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhdmd6a2tsZmllbmdkeHN5cW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY5NjAxOSwiZXhwIjoyMDkzMjcyMDE5fQ.xwb_uMzh4lGmdz_1sFy_CoRwCS8tUm7w_idKxmWTh_Q");

async function run() {
  const { data: roles, error: err1 } = await supabase.from('AppUserRole').select('*');
  console.log('AppUserRoles:', roles, 'error:', err1);
}
run();
