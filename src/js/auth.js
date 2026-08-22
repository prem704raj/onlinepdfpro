const SUPABASE_URL = "https://upwmevzyochrzskizesh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd21ldnp5b2Nocnpza2l6ZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTA0ODYsImV4cCI6MjEwMjk4NjQ4Nn0.Cvmg9mCDihoAW8qaXBetzEQwhtwmOQSAxcTe3IaKzAE";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------------------------
// RETURN USER TO PRODUCT AFTER LOGIN
// -------------------------------------
function saveAuthReturnUrl(url) {
  if (!url) url = window.location.pathname + window.location.search;
  localStorage.setItem("authReturnUrl", url);
}

function redirectAfterAuth() {
  const returnUrl = localStorage.getItem("authReturnUrl");
  localStorage.removeItem("authReturnUrl");

  // Never redirect back to login.
  if (
    returnUrl &&
    returnUrl.startsWith("/") &&
    !returnUrl.startsWith("/login")
  ) {
    window.location.replace(returnUrl);
    return;
  }

  // If login was opened manually,
  // go to homepage after authentication.
  window.location.replace("/");
}

// -------------------------------------
// CHECK LOGIN BEFORE BUYING
// -------------------------------------
async function requireLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    saveAuthReturnUrl();
    window.location.href = "/login";
    return false;
  }
  return true;
}

async function buyProduct(id) {
    const product = STORE_PRODUCTS[id];

    if (!product) {
        console.error("Product not found:", id);
        return;
    }

    const loggedIn = await requireLogin();

    if (!loggedIn) {
        return;
    }

    // Save direct purchase separately
    sessionStorage.setItem("buyNowProduct", id);

    // Next stage:
    // window.location.href = "/checkout.html";

    console.log("User ready to buy:", id);
}

// -------------------------------------
// EMAIL SIGN UP
// -------------------------------------
async function signup(email, password, fullName) {
  if (!fullName || fullName.trim().length < 2) {
    throw new Error("Please enter your full name.");
  }
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: "https://onlinepdfpro.com/login"
    }
  });
  if (error) {
    throw error;
  }
  return data;
}

// -------------------------------------
// EMAIL LOGIN
// -------------------------------------
async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    throw error;
  }
  redirectAfterAuth();
  return data;
}

// -------------------------------------
// GOOGLE LOGIN
// -------------------------------------
async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://onlinepdfpro.com/login"
    }
  });
  if (error) {
    throw error;
  }
}

// -------------------------------------
// LOGOUT
// -------------------------------------
async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error(error);
    return;
  }
  window.location.href = "/";
}

// -------------------------------------
// CURRENT USER
// -------------------------------------
async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// -------------------------------------
// GET USER NAME
// -------------------------------------
function getUserDisplayName(user) {
  if (!user) {
    return "";
  }
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User"
  );
}

// -------------------------------------
// GET PROFILE PHOTO
// -------------------------------------
function getUserAvatar(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null
  );
}

// -------------------------------------
// UPDATE HEADER WITH USER INFO
// -------------------------------------
async function updateUserHeader() {
  const user = await getCurrentUser();
  const container = document.getElementById("loggedInUser");
  if (!container) return;
  if (!user) {
    container.hidden = true;
    container.style.display = "none";
    return;
  }

  container.hidden = false;
  container.style.display = "flex";
  document.getElementById("loggedInName").textContent = getUserDisplayName(user);

  const avatar = getUserAvatar(user);
  const image = document.getElementById("loggedInAvatar");
  if (avatar) {
    image.src = avatar;
    image.hidden = false;
  } else {
    image.hidden = true;
  }
}

document.addEventListener("DOMContentLoaded", updateUserHeader);
