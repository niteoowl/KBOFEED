const supabaseUrl = 'https://zwjfaepctxoazrbcosix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3amZhZXBjdHhvYXpyYmNvc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzkyNzQsImV4cCI6MjA5MzkxNTI3NH0.JmnJDnfyyas21lWkIV5ORYE8BdqCbw2eJCDLvu2Gj6w';

async function test() {
  const url = `${supabaseUrl}/rest/v1/posts?select=*,profiles!posts_user_id_fkey(username,display_name),retweet_post:retweet_id(*,profiles!posts_user_id_fkey(username,display_name))&retweet_id=not.is.null&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
