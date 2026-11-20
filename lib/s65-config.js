/* Series 65 study site: shared Supabase settings (public values only). */
window.S65_SUPABASE = {
  url: "https://miiuxcvssiixymyewssz.supabase.co",
  anon: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paXV4Y3Zzc2lpeHlteWV3c3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDYxODMsImV4cCI6MjEwMjYyMjE4M30.qzDWqtmOg8jPacxngn97Up08MAx81AreoQYbSq4BjNU",
  email: "rodricdavies130@gmail.com"
};
window.S65_client = function () {
  if (!window.__s65sb) {
    window.__s65sb = window.supabase.createClient(window.S65_SUPABASE.url, window.S65_SUPABASE.anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "s65-auth" }
    });
  }
  return window.__s65sb;
};
