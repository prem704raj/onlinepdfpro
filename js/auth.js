const SUPABASE_URL = "https://upwmevzyochrzskizesh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd21ldnp5b2Nocnpza2l6ZXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTA0ODYsImV4cCI6MjEwMjk4NjQ4Nn0.Cvmg9mCDihoAW8qaXBetzEQwhtwmOQSAxcTe3IaKzAE";

// Safely create or retrieve Supabase client
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient && typeof supabase !== "undefined" && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
}

// Initial setup if library already loaded
if (typeof supabase !== "undefined" && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// -------------------------------------
// RETURN USER TO PRODUCT AFTER LOGIN
// -------------------------------------
function saveAuthReturnUrl(url) {
  const candidate = url || window.location.pathname + window.location.search;
  try {
    const parsed = new URL(candidate, window.location.origin);
    // Keep post-login navigation same-origin. In particular, reject
    // protocol-relative values such as //evil.example that start with '/'.
    if (parsed.origin !== window.location.origin || !parsed.pathname.startsWith("/") || parsed.pathname.startsWith("/login")) {
      localStorage.removeItem("authReturnUrl");
      return;
    }
    localStorage.setItem("authReturnUrl", parsed.pathname + parsed.search + parsed.hash);
  } catch {
    localStorage.removeItem("authReturnUrl");
  }
}

function redirectAfterAuth() {
  const returnUrl = localStorage.getItem("authReturnUrl");
  localStorage.removeItem("authReturnUrl");

  // Never redirect back to login or to another origin.
  try {
    const parsed = returnUrl ? new URL(returnUrl, window.location.origin) : null;
    if (parsed && parsed.origin === window.location.origin && parsed.pathname.startsWith("/") && !parsed.pathname.startsWith("/login")) {
      window.location.replace(parsed.pathname + parsed.search + parsed.hash);
      return;
    }
  } catch {
    // Fall through to the home page for malformed return URLs.
  }

  // If login was opened manually, go to homepage after authentication.
  window.location.replace("/");
}

// -------------------------------------
// CHECK LOGIN BEFORE BUYING
// -------------------------------------
async function requireLogin() {
  const client = getSupabaseClient();
  if (!client) {
    saveAuthReturnUrl();
    window.location.href = "/login.html";
    return false;
  }
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    saveAuthReturnUrl();
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

async function buyProduct(id) {
    if (typeof STORE_PRODUCTS !== "undefined" && !STORE_PRODUCTS[id]) {
        console.error("Product not found:", id);
        return;
    }

    const loggedIn = await requireLogin();
    if (!loggedIn) {
        return;
    }

    // Add to cart and immediately checkout. addToCart enforces the current
    // single-item cart policy for every Buy Now entry point.
    if (typeof addToCart !== "function" || !addToCart(id)) {
        return;
    }
    await checkoutCart();
}

// -------------------------------------
// EMAIL SIGN UP
// -------------------------------------
async function signup(email, password, fullName) {
  if (!fullName || fullName.trim().length < 2) {
    throw new Error("Please enter your full name.");
  }
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Authentication service is unavailable. Please check your internet connection.");
  }
  const redirectUrl = (window.location.origin || "https://onlinepdfpro.com") + "/login.html";
  const { data, error } = await client.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: redirectUrl
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
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Authentication service is unavailable. Please check your internet connection.");
  }
  const { data, error } = await client.auth.signInWithPassword({
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
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Authentication service is unavailable. Please check your internet connection or disable adblockers.");
  }
  const redirectUrl = (window.location.origin || "https://onlinepdfpro.com") + "/login.html";
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl
    }
  });
  if (error) {
    throw error;
  }
}

// -------------------------------------
// PASSWORD RESET
// -------------------------------------
async function requestPasswordReset(email) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Authentication service is unavailable. Please check your internet connection.");
  }
  const redirectTo = (window.location.origin || "https://onlinepdfpro.com") + "/login.html?mode=reset";
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

async function updatePassword(password) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Authentication service is unavailable. Please check your internet connection.");
  }
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

// -------------------------------------
// LOGOUT
// -------------------------------------
async function logout() {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
  }
  window.location.href = "/";
}

// -------------------------------------
// CURRENT USER
// -------------------------------------
async function getCurrentUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch (err) {
    console.warn("Could not retrieve user session:", err);
    return null;
  }
}

// -------------------------------------
// GET USER NAME
// -------------------------------------
function getUserDisplayName(user) {
  if (!user) {
    return "";
  }
  const metadata = user.user_metadata || {};
  const candidate = [metadata.full_name, metadata.name, user.email?.split("@")[0]]
    .find(value => typeof value === "string" && value.trim());
  return (candidate || "User").trim().slice(0, 120);
}

// -------------------------------------
// GET PROFILE PHOTO
// -------------------------------------
function getUserAvatar(user) {
  const candidate = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  if (typeof candidate !== "string" || candidate.length > 2048) return null;
  try {
    const parsed = new URL(candidate, window.location.origin);
    return (parsed.origin === window.location.origin || parsed.protocol === "https:")
      ? parsed.href
      : null;
  } catch {
    return null;
  }
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
  container.style.display = "block";

  const displayName = getUserDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();

  // Set dropdown name
  const dropdownName = document.getElementById("userDropdownName");
  if (dropdownName) dropdownName.textContent = displayName;

  // Set avatar or initial
  const avatar = getUserAvatar(user);
  const image = document.getElementById("loggedInAvatar");
  const initialEl = document.getElementById("loggedInInitial");

  if (avatar && image) {
    image.src = avatar;
    image.hidden = false;
    if (initialEl) initialEl.style.display = "none";
  } else {
    if (image) image.hidden = true;
    if (initialEl) {
      initialEl.textContent = initial;
      initialEl.style.display = "inline";
    }
  }

  // Dropdown toggle
  const btn = document.getElementById("userAvatarBtn");
  const dropdown = document.getElementById("userDropdown");
  if (btn && dropdown && !btn._hasDropdownHandler) {
    btn._hasDropdownHandler = true;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    });
    document.addEventListener("click", function () {
      dropdown.style.display = "none";
    });
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Sign out button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn && !logoutBtn._hasLogoutHandler) {
    logoutBtn._hasLogoutHandler = true;
    logoutBtn.addEventListener("click", function () {
      logout();
    });
  }
}

// Expose globally on window
window.supabaseClient = supabaseClient;
window.getSupabaseClient = getSupabaseClient;
window.signInWithGoogle = signInWithGoogle;
window.requestPasswordReset = requestPasswordReset;
window.updatePassword = updatePassword;
window.login = login;
window.signup = signup;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getUserDisplayName = getUserDisplayName;
window.getUserAvatar = getUserAvatar;
window.updateUserHeader = updateUserHeader;
window.requireLogin = requireLogin;
window.buyProduct = buyProduct;
window.saveAuthReturnUrl = saveAuthReturnUrl;
window.redirectAfterAuth = redirectAfterAuth;

document.addEventListener("DOMContentLoaded", updateUserHeader);
