const { data, error } = await supabase
  .from('daily_devotionals')
  .select('*')
  .eq('devotional_date', '2025-05-17');

if (error) {
  console.error('Erro ao buscar devocional:', error);
  // Tratar erro
} else if (data && data.length > 0) {
  const devotional = data[0]; // Pega o primeiro se houver múltiplos (improvável com data)
  // Usar devotional
} else {
  console.log('Nenhum devocional encontrado para esta data.');
  // Tratar ausência de devocional
}