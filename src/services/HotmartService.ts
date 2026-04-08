
/**
 * Servico de Gerenciamento de Assinaturas Hotmart
 * Substitui o StripeService para controle de acesso Pro
 */
export const HotmartService = {
  /**
   * Verifica se o usuario tem uma assinatura ativa no banco de dados local
   * A atualizacao do campo is_pro e feita via Webhook pela Hotmart
   */
  async checkSubscriptionStatus(supabase: any, userId: string) {
    let { data, error } = await supabase
      .from('profiles')
      .select('is_pro, trial_started_at')
      .eq('id', userId)
      .single();

    // Se o perfil nao existir, cria um perfil com trial
    if (error && error.code === 'PGRST116') {
      const trialStartedAt = new Date().toISOString();
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          is_pro: false,
          trial_started_at: trialStartedAt,
        }, { onConflict: 'id' })
        .select('is_pro, trial_started_at')
        .single();

      if (createError) {
        return { isPro: false, trialExpired: true, trialRemainingMs: 0 };
      }

      data = createdProfile;
      error = null;
    }

    if (error || !data) {
      return { isPro: false, trialExpired: true, trialRemainingMs: 0 };
    }

    const now = Date.now();
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    const userMetadata = authUser?.user_metadata || {};

    // Bypass para administradores
    const isAdminUser = ['admin', 'everto', 'everton', 'squad-pro', 'achadinhos_brasil_'].includes((userMetadata.store_slug || '').toLowerCase());
    
    // Na integracao Hotmart, o is_pro ja deve estar atualizado no banco pela Edge Function
    // Se is_pro for true, consideramos ativo (podemos adicionar expiracao se necessario)
    const isProActive = Boolean(data.is_pro || isAdminUser);

    if (isAdminUser) {
      return {
        isPro: true,
        trialExpired: false,
        trialRemainingMs: null,
      };
    }

    if (isProActive) {
      // Para fins de demonstracao do fluxo de expiracao PRO solicitado pelo usuario,
      // calculamos uma expiracao baseada em 30 dias se nao houver data especifica.
      const subDuration = 30 * 24 * 60 * 60 * 1000;
      const startedAt = data.trial_started_at || data.updated_at || new Date().toISOString();
      const expirationDate = new Date(startedAt).getTime() + subDuration;
      
      return {
        isPro: true,
        trialExpired: false,
        trialRemainingMs: Math.max(0, expirationDate - now), 
      };
    }

    // Controle de Trial (24 horas)
    const trialDuration = 24 * 60 * 60 * 1000;
    const trialStartedAt = data.trial_started_at ? new Date(data.trial_started_at).getTime() : Date.now();
    const trialExpired = now - trialStartedAt > trialDuration;

    return {
      isPro: false,
      trialExpired,
      trialRemainingMs: Math.max(0, trialDuration - (now - trialStartedAt))
    };
  },

  /**
   * Redireciona o usuario para o checkout da Hotmart
   * @param checkoutUrl URL do produto na Hotmart fornecida pelo usuario
   */
  redirectToCheckout(checkoutUrl: string) {
    if (!checkoutUrl) {
      console.error("URL de Checkout da Hotmart nao configurada.");
      return;
    }
    window.location.href = checkoutUrl;
  }
};
