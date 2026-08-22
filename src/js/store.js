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

async function checkoutCart() {
    const cart = getCart();

    if (!cart.length) {
        return;
    }

    const loggedIn =
        await requireLogin();

    if (!loggedIn) {
        return;
    }

    // NEXT STEP:
    // Send product IDs to your backend.
    // Backend calculates prices and creates Razorpay order.

    console.log(
        "Ready for checkout:",
        cart.map(item => item.id)
    );
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
