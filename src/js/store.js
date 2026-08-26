const STORE_PRODUCTS = {
    "dbms-notes": {
        id: "dbms-notes",
        title: "DBMS Complete Notes",
        price: 49,
        image: "/logo.png",
        url: "/study-materials.html"
    }
};

function getCart() {
    try {
        return JSON.parse(localStorage.getItem("onlinepdfpro_cart")) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(
        "onlinepdfpro_cart",
        JSON.stringify(cart)
    );

    updateCartCount();
    renderCart();
}

function addToCart(productId) {
    const product = STORE_PRODUCTS[productId];

    if (!product) {
        console.error("Unknown product:", productId);
        return;
    }

    const cart = getCart();

    const alreadyExists = cart.some(
        item => item.id === productId
    );

    if (!alreadyExists) {
        cart.push(product);
        saveCart(cart);
    }

    openCart();
}

function removeFromCart(productId) {
    const cart = getCart().filter(
        item => item.id !== productId
    );

    saveCart(cart);
}

function clearCart() {
    saveCart([]);
}

function getCartTotal() {
    return getCart().reduce(
        (sum, item) => sum + Number(item.price || 0),
        0
    );
}

function updateCartCount() {
    const count = getCart().length;

    document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = count;
        el.hidden = count === 0;
    });
}

function openCart() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");

    if (!drawer || !overlay) return;

    renderCart();

    drawer.classList.add("open");
    overlay.classList.add("open");

    document.body.style.overflow = "hidden";
}

function closeCart() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");

    if (!drawer || !overlay) return;

    drawer.classList.remove("open");
    overlay.classList.remove("open");

    document.body.style.overflow = "";
}

function renderCart() {
    const container =
        document.getElementById("cartItems");

    const totalElement =
        document.getElementById("cartTotal");

    if (!container || !totalElement) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p>Your cart is empty.</p>
                <button onclick="closeCart()" style="margin-top: 15px; padding: 10px 20px; background: var(--sm-accent); color: white; border: none; font-weight: bold; cursor: pointer;">
                    Continue Shopping
                </button>
            </div>
        `;

        totalElement.textContent = "₹0";
        return;
    }

    container.innerHTML = "";

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const title = document.createElement("strong");
        title.textContent = item.title;

        const price = document.createElement("span");
        price.textContent = `₹${item.price}`;

        info.appendChild(title);
        info.appendChild(price);

        const remove = document.createElement("button");
        remove.className = "cart-remove";
        remove.textContent = "Remove";

        remove.addEventListener("click", () => {
            removeFromCart(item.id);
        });

        row.appendChild(info);
        row.appendChild(remove);

        container.appendChild(row);
    });

    totalElement.textContent =
        `₹${getCartTotal()}`;
}

async function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

async function checkoutCart() {
    const cart = getCart();

    if (!cart.length) {
        return;
    }

    const loggedIn = await requireLogin();
    if (!loggedIn) {
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    // We only support checkout of 1 item at a time for this MVP
    const product = cart[0];

    try {
        // Show loading state (simplistic alert for now, could be a spinner)
        const btn = document.querySelector('.cart-checkout');
        if (btn) btn.textContent = 'Processing...';

        // 1. Get auth token
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        // 2. Call backend to create order
        const res = await fetch('https://pdf-api-proxy.prem704raj.workers.dev/store/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                product_id: product.id,
                user_id: user.id
            })
        });

        if (!res.ok) {
            throw new Error('Failed to create order');
        }

        const orderData = await res.json();

        // 3. Load Razorpay
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            throw new Error('Failed to load payment gateway');
        }

        // 4. Open Razorpay Checkout
        const options = {
            key: "rzp_live_TUU0msSo8hDUpP", // Need to use Live key here if on live mode, ideally should be fetched from backend or passed
            amount: orderData.amount,
            currency: orderData.currency,
            name: "OnlinePDFPro",
            description: product.title,
            image: "/logo.png",
            order_id: orderData.order_id,
            handler: async function (response) {
                try {
                    const verifyRes = await fetch('https://pdf-api-proxy.prem704raj.workers.dev/store/verify-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            product_id: product.id,
                            user_id: user.id,
                            amount: orderData.amount
                        })
                    });

                    if (verifyRes.ok) {
                        // Clear cart
                        clearCart();
                        closeCart();
                        alert("Payment successful! Redirecting to your library.");
                        window.location.href = "/library.html";
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                } catch (err) {
                    console.error("Verification error", err);
                    alert("Error verifying payment.");
                }
            },
            prefill: {
                name: getUserDisplayName(user) || "",
                email: user.email || ""
            },
            theme: {
                color: "#7c3aed"
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
            console.error(response.error);
            alert("Payment failed: " + response.error.description);
        });
        rzp.open();

    } catch (err) {
        console.error(err);
        alert(err.message || "An error occurred during checkout.");
    } finally {
        const btn = document.querySelector('.cart-checkout');
        if (btn) btn.textContent = 'Checkout';
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        updateCartCount();
        renderCart();
    }
);

// -------------------------------------
// PROFILE JS
// -------------------------------------

async function initializeStoreProfile() {

    const wrap =
        document.getElementById("profileMenuWrap");

    if (!wrap) return;

    const user =
        await getCurrentUser();

    if (!user) {
        wrap.hidden = true;
        return;
    }

    wrap.hidden = false;

    const name =
        getUserDisplayName(user);

    const avatar =
        getUserAvatar(user);


    const nameElement =
        document.getElementById("profileName");

    const emailElement =
        document.getElementById("profileEmail");

    const initialElement =
        document.getElementById("profileInitial");

    const avatarElement =
        document.getElementById("profileAvatar");


    nameElement.textContent =
        name;

    emailElement.textContent =
        user.email || "";

    initialElement.textContent =
        name.charAt(0).toUpperCase();


    if (avatar) {

        avatarElement.src =
            avatar;

        avatarElement.hidden =
            false;

        initialElement.hidden =
            true;

    } else {

        avatarElement.hidden =
            true;

        initialElement.hidden =
            false;

    }
}


function setupProfileMenu() {

    const trigger =
        document.getElementById("profileTrigger");

    const dropdown =
        document.getElementById("profileDropdown");


    if (!trigger || !dropdown) {
        return;
    }


    trigger.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            const isOpen =
                !dropdown.hidden;

            dropdown.hidden =
                isOpen;

            trigger.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

        }
    );


    document.addEventListener(
        "click",
        function () {

            dropdown.hidden =
                true;

            trigger.setAttribute(
                "aria-expanded",
                "false"
            );

        }
    );


    dropdown.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );
}


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await initializeStoreProfile();

        setupProfileMenu();

    }
);
