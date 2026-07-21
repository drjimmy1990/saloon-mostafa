import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...val] = trimmed.split('=');
          const value = val.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  console.error('Please set them in your environment or .env.local file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function tryEnsureConstraint() {
  const ddlSql = `
    ALTER TABLE "public"."AppUserRole" DROP CONSTRAINT IF EXISTS "AppUserRole_role_check";
    ALTER TABLE "public"."AppUserRole" ADD CONSTRAINT "AppUserRole_role_check" CHECK (role IN ('admin', 'team', 'demo'));
  `;
  try {
    const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', { sql: ddlSql });
    if (!rpcError) {
      console.log('✅ Applied DB check constraint migration via RPC exec_sql');
    }
  } catch (_err) {
    // RPC exec_sql may not be defined on standard Supabase schema; fallback to direct upsert
  }
}

export async function seedDemoUser() {
  const DEMO_EMAIL = 'demo@demo.com';
  const DEMO_PASSWORD = 'demo1234';
  const DEMO_NAME = 'مستخدم تجريبي';

  console.log(`🚀 Starting demo user seeding for: ${DEMO_EMAIL}`);

  // Attempt RPC constraint update if available
  await tryEnsureConstraint();

  let userId: string | null = null;

  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to list Supabase auth users:', listError.message);
    process.exit(1);
  }

  const existingAuthUser = usersData.users.find((u) => u.email === DEMO_EMAIL);

  if (existingAuthUser) {
    console.log(`✅ Auth user found for ${DEMO_EMAIL} (ID: ${existingAuthUser.id})`);
    userId = existingAuthUser.id;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (updateError) {
      console.warn(`⚠️ Warning updating user password: ${updateError.message}`);
    } else {
      console.log(`✅ Verified/updated password for ${DEMO_EMAIL}`);
    }
  } else {
    console.log(`➕ Creating user in Supabase Auth: ${DEMO_EMAIL}`);
    const { data: createdData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name: DEMO_NAME },
    });

    if (createError) {
      console.error('❌ Failed to create Supabase auth user:', createError.message);
      process.exit(1);
    }

    userId = createdData.user.id;
    console.log(`✅ Created Supabase Auth user (ID: ${userId})`);
  }

  console.log(`📝 Upserting AppUserRole record for user_id: ${userId}`);

  const { data: existingRoleRecord } = await supabaseAdmin
    .from('AppUserRole')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let dbResult;

  if (existingRoleRecord) {
    dbResult = await supabaseAdmin
      .from('AppUserRole')
      .update({
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        role: 'demo',
        permissions: [],
      })
      .eq('user_id', userId)
      .select()
      .single();
  } else {
    dbResult = await supabaseAdmin
      .from('AppUserRole')
      .insert({
        user_id: userId,
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        role: 'demo',
        permissions: [],
      })
      .select()
      .single();
  }

  if (dbResult.error) {
    console.error('❌ Error inserting/updating AppUserRole record:', dbResult.error.message);
    if (dbResult.error.message.includes('AppUserRole_role_check')) {
      console.error('👉 Cause: Database check constraint AppUserRole_role_check does not allow "demo".');
      console.error('👉 Resolution: Execute migration 008 (migrations/008_update_appuserrole_check_constraint.sql) in Supabase SQL Editor:');
      console.error('   ALTER TABLE "public"."AppUserRole" DROP CONSTRAINT IF EXISTS "AppUserRole_role_check";');
      console.error('   ALTER TABLE "public"."AppUserRole" ADD CONSTRAINT "AppUserRole_role_check" CHECK (role IN (\'admin\', \'team\', \'demo\'));');
    }
    process.exit(1);
  }

  // Verification step
  const { data: verifyRecord, error: verifyError } = await supabaseAdmin
    .from('AppUserRole')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verifyError || !verifyRecord || verifyRecord.role !== 'demo') {
    console.error('❌ Seeding verification failed! Record:', verifyRecord, 'Error:', verifyError);
    process.exit(1);
  }

  console.log('✅ Post-seeding verification passed!');
  console.log('🎉 Demo user seeding completed successfully!');
  console.log('Verified AppUserRole Record:', verifyRecord);
}

if (require.main === module) {
  seedDemoUser().catch((err) => {
    console.error('❌ Unexpected error during seed:', err);
    process.exit(1);
  });
}
