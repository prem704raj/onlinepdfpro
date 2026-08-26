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
    window.location.href = "/login";
    return false;
  }
  const { data: { session } } = await client.auth.getSession();
  if (!session) {
    saveAuthReturnUrl();
    window.location.href = "/login";
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

    // Save direct purchase separately
    sessionStorage.setItem("buyNowProduct", id);
    alert("Thank you for your interest! Checkout is coming soon. We\u2019ll notify you when it\u2019s ready.");
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
  const redirectUrl = (window.location.origin || "https://onlinepdfpro.com") + "/login";
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
  const redirectUrl = (window.location.origin || "https://onlinepdfpro.com") + "/login";
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
window.login = login;
window.signup = signup;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getUserDisplayName = getUserDisplayName;
window.getUserAvatar = getUserAvatar;
window.updateUserHeader = updateUserHeader;

document.addEventListener("DOMContentLoaded", updateUserHeader);
