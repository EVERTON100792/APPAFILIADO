
// Substitua por suas chaves reais do Painel do Stripe
// O usuário deve fornecer estas chaves no futuro
export const StripeService = {
  async authorizedPost(path: string, body: Record<string, any>, supabase: any) {
    let { data: sessionData } = await supabase.auth.getSession();
    let accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      accessToken = refreshed?.session?.access_token;
    }

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    const doRequest = async (token: string) => fetch(`https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eWRwcWlsdnlqcWpiaHpnemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzY3MDUsImV4cCI6MjA5MDExMjcwNX0.MNc0r2Y0-fLClVX1cUXTxZwzXsNsZnMUMT0p1Gl0dS4',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    let response = await doRequest(accessToken);
    let data = await response.json();

    if (!response.ok && response.status === 401) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed?.session?.access_token) {
        throw new Error(data?.message || data?.error || 'Sessao invalida. Entre novamente para continuar.');
      }
      response = await doRequest(refreshed.session.access_token);
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Falha ao processar requisicao Stripe.');
    }

    return data;
  },

  /**
   * Redireciona o usuário para o Checkout do Stripe
   * @param priceId O ID do Preço (ex: price_123...) criado no Stripe
   * @param customerEmail Email do usuário para pré-preenchimento
   */
  async redirectToCheckout(supabase: any, priceId: string, userId: string, customerEmail: string) {
    try {
      const data = await this.authorizedPost('stripe-checkout', { priceId, email: customerEmail, userId }, supabase);

      if (data?.url) {
        window.location.href = data.url;
      }
      
      return true;
    } catch (err) {
      return false;
    }
  },

  async openCustomerPortal(supabase: any, customerEmail: string) {
    try {
      const data = await this.authorizedPost('stripe-portal', { email: customerEmail }, supabase);

      if (data?.url) {
        window.location.href = data.url;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Verifica se o usuário tem uma assinatura ativa
   * @param userId UID do Supabase
   */
  async checkSubscriptionStatus(supabase: any, userId: string) {
    let { data, error } = await supabase
      .from('profiles')
      .select('is_pro, trial_started_at')
      .eq('id', userId)
      .single();

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

    if (error) {
      return { isPro: false, trialExpired: true, trialRemainingMs: 0 };
    }

    if (!data) {
      return { isPro: false, trialExpired: true, trialRemainingMs: 0 };
    }

    const now = Date.now();
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    const proExpiresAt = authUser?.user_metadata?.pro_expires_at ? new Date(authUser.user_metadata.pro_expires_at).getTime() : null;
    const isProActive = Boolean(data.is_pro && proExpiresAt && proExpiresAt > now);

    if (data.is_pro && proExpiresAt && proExpiresAt <= now) {
      await supabase
        .from('profiles')
        .update({ is_pro: false })
        .eq('id', userId);

      await supabase.auth.updateUser({
        data: {
          ...(authUser?.user_metadata || {}),
          is_pro: false,
          pro_expires_at: null,
          stripe_subscription_id: null,
        },
      });

      return {
        isPro: false,
        trialExpired: true,
        trialRemainingMs: 0,
      };
    }

    if (isProActive) {
      const proRemainingMs = Math.max(0, (proExpiresAt || now) - now);
      return {
        isPro: true,
        trialExpired: false,
        trialRemainingMs: proRemainingMs,
      };
    }

    const trialDuration = 24 * 60 * 60 * 1000;
    const trialStartedAt = data.trial_started_at ? new Date(data.trial_started_at).getTime() : Date.now();
    const trialExpired = now - trialStartedAt > trialDuration;

    return {
      isPro: false,
      trialExpired,
      trialRemainingMs: Math.max(0, trialDuration - (now - trialStartedAt))
    };
  }
};
