const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing Supabase questions insert...");
  const { data, error } = await supabase.from('questions').insert({
    title: 'Test',
    content: 'Test content',
    tags: ['Math'],
    points: 0
  });
  console.log("Insert Error Details:");
  console.dir(error, { depth: null });
}
test();
