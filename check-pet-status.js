// 检查宠物当前状态
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPetStatus() {
  try {
    console.log('🔍 查询宠物状态...');
    
    // 获取最近更新的宠物（假设这是你测试的宠物）
    const { data: pets, error } = await supabase
      .from('pets')
      .select('id, name, lost_mode, lost_since, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }

    console.log('\n📊 最近更新的宠物状态:');
    pets.forEach((pet, index) => {
      console.log(`\n${index + 1}. 宠物: ${pet.name || '未命名'}`);
      console.log(`   ID: ${pet.id}`);
      console.log(`   丢失状态: ${pet.lost_mode ? '🚨 已丢失' : '✅ 安全'}`);
      console.log(`   丢失时间: ${pet.lost_since || '无'}`);
      console.log(`   创建时间: ${pet.created_at}`);
    });

    // 检查特定宠物 ID（如果你知道的话）
    const testPetId = '5e6c46d2-95f2-4682-85ad-919c8d63e8e0'; // 从日志中看到的 ID
    const { data: testPet } = await supabase
      .from('pets')
      .select('*')
      .eq('id', testPetId)
      .maybeSingle();

    if (testPet) {
      console.log(`\n🎯 测试宠物详情 (${testPetId}):`);
      console.log(`   名称: ${testPet.name || '未命名'}`);
      console.log(`   当前状态: ${testPet.lost_mode ? '🚨 已丢失' : '✅ 安全'}`);
      console.log(`   丢失时间: ${testPet.lost_since || '无'}`);
      console.log(`   创建时间: ${testPet.created_at}`);
      
      if (testPet.lost_mode) {
        console.log('\n💡 分析: 宠物当前已是"丢失"状态');
        console.log('   再次点击 Lost 按钮不会发送邮件，因为状态没有变化');
        console.log('   解决方案: 先点击 Found，再点击 Lost');
      } else {
        console.log('\n💡 分析: 宠物当前是"安全"状态');
        console.log('   点击 Lost 按钮会发送邮件');
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkPetStatus();
