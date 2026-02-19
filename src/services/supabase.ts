/**
 * Supabase client service
 * Provides a singleton Supabase client for use across the app.
 * Follows the same pattern as USGSService: class with options, default singleton export.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseClientOptions {
  url?: string;
  anonKey?: string;
}

export class SupabaseClientService {
  private client: SupabaseClient | null = null;
  private readonly url: string | undefined;
  private readonly anonKey: string | undefined;

  constructor(options: SupabaseClientOptions = {}) {
    this.url = options.url ?? Deno.env.get('SUPABASE_URL');
    this.anonKey = options.anonKey ?? Deno.env.get('SUPABASE_ANON_KEY');
  }

  /** Whether Supabase is configured (URL and anon key are set). */
  isAvailable(): boolean {
    return !!(this.url && this.anonKey);
  }

  /** Returns the Supabase client, creating it lazily on first call. */
  getClient(): SupabaseClient {
    if (!this.url || !this.anonKey) {
      throw new Error(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.',
      );
    }

    if (!this.client) {
      this.client = createClient(this.url, this.anonKey);
    }

    return this.client;
  }
}

/** Default singleton instance, configured from environment variables. */
export const supabaseService = new SupabaseClientService();
