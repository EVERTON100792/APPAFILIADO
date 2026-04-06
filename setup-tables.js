import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzydpqilvyjqjbhzgzhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Criando tabelas...');
  
  // Criar tabela bio_store_settings
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS bio_store_settings (
        user_id TEXT PRIMARY KEY,
        theme_color TEXT DEFAULT '#10b981',
        accent_color TEXT DEFAULT '#10b981',
        bg_color TEXT DEFAULT '#050505',
        text_color TEXT DEFAULT '#e2e8f0',
        layout_type TEXT DEFAULT 'grid',
        font_style TEXT DEFAULT 'sans',
        header_style TEXT DEFAULT 'default',
        show_watermark BOOLEAN DEFAULT true,
        card_radius TEXT DEFAULT '1.5rem',
        profile_image TEXT DEFAULT '',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (error1) {
    console.log('Tentando另一种方式...');
  }
  
  // Verificar se a tabela já existe
  const { data: checkData, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'bio_store_settings');
    
  console.log('Tabelas existentes:', checkData);
  
  // Tentar inserir um registro de teste para ver se a tabela funciona
  const { error: insertError } = await supabase
    .from('bio_store_settings')
    .upsert({ user_id: 'test', theme_color: '#10b981' }, { onConflict: 'user_id' });
    
  if (insertError) {
    console.log('Erro ao inserir:', insertError.message);
    console.log('A tabela bio_store_settings pode não existir ainda.');
    console.log('Por favor, execute este SQL no seu Supabase SQL Editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS bio_store_settings (
  user_id TEXT PRIMARY KEY,
  theme_color TEXT DEFAULT '#10b981',
  accent_color TEXT DEFAULT '#10b981',
  bg_color TEXT DEFAULT '#050505',
  text_color TEXT DEFAULT '#e2e8f0',
  layout_type TEXT DEFAULT 'grid',
  font_style TEXT DEFAULT 'sans',
  header_style TEXT DEFAULT 'default',
  show_watermark BOOLEAN DEFAULT true,
  card_radius TEXT DEFAULT '1.5rem',
  profile_image TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bio_store_settings ENABLE REALTIME;
    `);
  } else {
    console.log('Tabela bio_store_settings funcionando!');
  }
  
  // Verificar bio_store
  const { data: storeData, error: storeError } = await supabase
    .from('bio_store')
    .select('user_id')
    .limit(5);
    
  console.log('bio_store dados:', storeData, storeError);
}

setupTables();
