const SUPABASE_URL = "https://upwmevzyochrzskizesh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd21ldnp5b2Nocnpza2l6ZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTA0ODYsImV4cCI6MjEwMjk4NjQ4Nn0.Cvmg9mCDihoAW8qaXBetzEQwhtwmOQSAxcTe3IaKzAE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Check login before buying
async function requireLogin(productId){
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user){
    localStorage.setItem("pendingProduct", productId);
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

async function buyProduct(id){ 
  const loggedIn = await requireLogin(id); 
  if(!loggedIn){ 
    return; 
  } 
  // next step: 
  // open Razorpay payment 
}
