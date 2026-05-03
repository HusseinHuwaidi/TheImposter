import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase URL and Anon Key
// You can find these in your Supabase Dashboard under Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.com/dashboard/project/nkidhbjbgrotxvqgcsak';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5raWRoYmpiZ3JvdHh2cWdjc2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTM4NzYsImV4cCI6MjA5MzM4OTg3Nn0.ihFE92a479nWxfXGq-nShqOxpC4QFQDIKOzMyudLRgo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to subscribe to room changes
export const subscribeToRoom = (pin, callback) => {
  return supabase
    .channel(`room:${pin}`)
    .on('broadcast', { event: 'state_change' }, payload => {
      callback(payload.payload);
    })
    .subscribe();
};

// Helper function to broadcast state from Host
export const broadcastGameState = async (pin, state) => {
  const channel = supabase.channel(`room:${pin}`);
  await channel.send({
    type: 'broadcast',
    event: 'state_change',
    payload: state,
  });
};
