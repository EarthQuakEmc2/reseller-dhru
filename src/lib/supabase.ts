import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://glvrpirxkopcuyduazqo.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEwMmQwZGZiLTQxYTktNGU1NS1iNDk2LTcyMjM3YzA0MTAwNiJ9.eyJwcm9qZWN0SWQiOiJnbHZycGlyeGtvcGN1eWR1YXpxbyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5NTk0MDQ2LCJleHAiOjIwOTQ5NTQwNDYsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.eFTD73tPNUUyFTQfGcTjXc4txyUEabOQlYA406lPtzQ';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };