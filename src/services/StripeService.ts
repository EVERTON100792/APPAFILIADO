
// Substitua por suas chaves reais do Painel do Stripe
// O usuário deve fornecer estas chaves no futuro
export const StripeService = {
  /**
   * Redireciona o usuário para o Checkout do Stripe
   * @param priceId O ID do Preço (ex: price_123...) criado no Stripe
   * @param customerEmail Email do usuário para pré-preenchimento
   */
  async redirectToCheckout(supabase: any, priceId: string, userId: string, customerEmail: string) {
    try {
      console.log('Solicitando sessão de checkout...', { priceId, userId, customerEmail });
      
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId, email: customerEmail, userId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
      
      return true;
    } catch (err) {
      console.error('Erro no Stripe:', err);
      return false;
    }
  },

  /**
   * Verifica se o usuário tem uma assinatura ativa
   * @param userId UID do Supabase
   */
  async checkSubscriptionStatus(supabase: any, userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_pro, trial_started_at')
      .eq('id', userId)
      .single();

    if (error) return { isPro: false, trialExpired: true };

    const trialDuration = 24 * 60 * 60 * 1000; // 24 horas em ms
    const trialStartedAt = new Date(data.trial_started_at).getTime();
    const now = Date.now();
    const trialExpired = now - trialStartedAt > trialDuration;

    return {
      isPro: data.is_pro,
      trialExpired,
      trialRemainingMs: Math.max(0, trialDuration - (now - trialStartedAt))
    };
  }
};
