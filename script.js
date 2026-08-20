// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyB3kgqT5_nkdH7jFsuJheqC88ejiBQWP4w",
  authDomain: "mora-style.firebaseapp.com",
  projectId: "mora-style",
  storageBucket: "mora-style.firebasestorage.app",
  messagingSenderId: "567869295599",
  appId: "1:567869295599:web:c02cd4f06d65591b8cc41a",
  measurementId: "G-NWZDS22FHG"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// --- CONFIGURATION ET ETAT GLOBAL ---
const GAS_URL = "https://script.google.com/macros/s/AKfycbxoVnCbFtevHutgwfCeNXD7e971H_gwx9E87KsVwQTQ6Oh6YERGF6a7u_i2FVMOJwMZ/exec"; 

let products = [];
let cart = [];
let orders = JSON.parse(localStorage.getItem('morastyle_orders')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('morastyle_user')) || null;
let deliveryFee = 3000;
let currentCategory = 'all';

const paymentNumbers = {
    "MVola": "MVola : +261 34 97 981 95 (Mora Style)",
    "Orange Money": "Orange Money : +261 32 00 000 00 (Mora Style)",
    "Airtel Money": "Airtel Money : +261 33 00 000 00 (Mora Style)"
};

// --- DOM ELEMENTS ---
const navHome = document.getElementById('nav-home');
const navShop = document.getElementById('nav-shop');
const navAdmin = document.getElementById('nav-admin');
const navUserDashboard = document.getElementById('nav-user-dashboard'); 
const navLogin = document.getElementById('nav-login');
const navLogout = document.getElementById('nav-logout');

const homePage = document.getElementById('home-page');
const shopPage = document.getElementById('shop-page');
const adminPage = document.getElementById('admin-page');
const userDashboardPage = document.getElementById('user-dashboard-page'); 

const authModal = document.getElementById('auth-modal');
const closeAuth = document.getElementById('close-auth');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');

// --- FONCTIONS UTILITAIRES ---
function clearAuthFields() {
    const fieldsToClear = ['login-email', 'login-pwd', 'reg-name', 'reg-email', 'reg-pwd'];
    fieldsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// --- OBSERVATEUR FIREBASE (Maintient la session) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // L'utilisateur est connecté
        currentUser = {
            nom: user.displayName || "Client",
            email: user.email,
            // Définition automatique du rôle admin via l'email
            role: user.email === "rjnasolo@gmail.com" ? "admin" : "client"
        };
        sessionStorage.setItem('morastyle_user', JSON.stringify(currentUser));
        updateUIPerUser();
        clearAuthFields();
        if(authModal) authModal.classList.add('hidden');
        
        // Réinitialisation des textes de boutons
        if(document.getElementById('btn-login-submit')) document.getElementById('btn-login-submit').innerText = "Se connecter";
        if(document.getElementById('btn-register-submit')) document.getElementById('btn-register-submit').innerText = "Créer mon compte";
    } else {
        // L'utilisateur est déconnecté
        currentUser = null;
        sessionStorage.removeItem('morastyle_user');
        updateUIPerUser();
    }
});

// --- INITIALISATION UI ---
function updateUIPerUser() {
    if (currentUser) {
        navLogin.classList.add('hidden');
        navLogout.classList.remove('hidden');
        navUserDashboard.classList.remove('hidden'); 
        
        if (document.getElementById('client-name')) {
            document.getElementById('client-name').value = currentUser.nom;
        }
        
        if (currentUser.role === 'admin') {
            navAdmin.classList.remove('hidden');
        } else {
            navAdmin.classList.add('hidden');
        }
    } else {
        navLogin.classList.remove('hidden');
        navLogout.classList.add('hidden');
        navAdmin.classList.add('hidden');
        navUserDashboard.classList.add('hidden'); 
        if (document.getElementById('client-name')) {
            document.getElementById('client-name').value = "";
        }
    }
}

// --- NAVIGATION ---
function switchTab(tab) {
    [homePage, shopPage, adminPage, userDashboardPage].forEach(page => { if(page) page.classList.add('hidden') });
    [navHome, navShop, navAdmin, navUserDashboard].forEach(btn => { if(btn) btn.classList.remove('active') });

    if (tab === 'home' && homePage) {
        homePage.classList.remove('hidden');
        navHome.classList.add('active');
    } else if (tab === 'shop' && shopPage) {
        shopPage.classList.remove('hidden');
        navShop.classList.add('active');
    } else if (tab === 'admin' && adminPage && currentUser && currentUser.role === 'admin') {
        adminPage.classList.remove('hidden');
        navAdmin.classList.add('active');
        renderAdminOrders();
    } else if (tab === 'user-dashboard' && userDashboardPage && currentUser) {
        userDashboardPage.classList.remove('hidden');
        navUserDashboard.classList.add('active');
        renderUserOrders(); 
    }
}

if(navHome) navHome.addEventListener('click', () => switchTab('home'));
if(navShop) navShop.addEventListener('click', () => switchTab('shop'));
if(navAdmin) navAdmin.addEventListener('click', () => switchTab('admin'));
if(navUserDashboard) navUserDashboard.addEventListener('click', () => switchTab('user-dashboard')); 
if(document.getElementById('btn-go-shop')) document.getElementById('btn-go-shop').addEventListener('click', () => switchTab('shop'));

if(navLogout) {
    navLogout.addEventListener('click', () => {
        auth.signOut().then(() => {
            switchTab('home');
            alert("Vous êtes déconnecté.");
        }).catch((error) => {
            console.error("Erreur déconnexion:", error);
        });
    });
}

// --- AUTHENTIFICATION AVEC FIREBASE ---
if(navLogin) {
    navLogin.addEventListener('click', () => {
        clearAuthFields(); 
        authModal.classList.remove('hidden');
    });
}
if(closeAuth) closeAuth.addEventListener('click', () => authModal.classList.add('hidden'));

if(document.getElementById('show-register')) {
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.innerText = "Inscription";
    });
}

if(document.getElementById('show-login')) {
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authTitle.innerText = "Connexion";
    });
}

// Firebase : Connexion
if(document.getElementById('btn-login-submit')) {
    document.getElementById('btn-login-submit').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const pwd = document.getElementById('login-pwd').value.trim();
        if(!email || !pwd) return alert("Veuillez remplir tous les champs");
        
        const btn = document.getElementById('btn-login-submit');
        btn.innerText = "Connexion en cours...";
        
        try {
            await auth.signInWithEmailAndPassword(email, pwd);
            // La suite est gérée par onAuthStateChanged()
        } catch (error) {
            alert("Erreur de connexion : Vérifiez vos identifiants.");
            btn.innerText = "Se connecter";
        }
    });
}

// Firebase : Inscription
if(document.getElementById('btn-register-submit')) {
    document.getElementById('btn-register-submit').addEventListener('click', async () => {
        const nom = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pwd = document.getElementById('reg-pwd').value.trim();
        if(!nom || !email || !pwd) return alert("Veuillez remplir tous les champs");
        
        const btn = document.getElementById('btn-register-submit');
        btn.innerText = "Création en cours...";
        
        try {
            // Création du compte
            const userCredential = await auth.createUserWithEmailAndPassword(email, pwd);
            
            // Mise à jour du profil avec le nom de l'utilisateur
            await userCredential.user.updateProfile({
                displayName: nom
            });
            
            // Forcer le rafraîchissement pour l'observateur
            await auth.currentUser.reload();
            
            alert("Compte créé avec succès !");
            // La fermeture de la modale est gérée par onAuthStateChanged()
        } catch (error) {
            alert("Erreur lors de l'inscription : " + error.message);
            btn.innerText = "Créer mon compte";
        }
    });
}
const forgotPasswordLink = document.getElementById('forgot-password-link');

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email').value.trim();
        
        if (!emailInput) {
            alert("Veuillez d'abord saisir votre adresse e-mail dans le champ de connexion ci-dessus, puis cliqué sur 'Mot de passe oublié'.");
            return;
        }

        try {
            await auth.sendPasswordResetEmail(emailInput);
            alert("Un e-mail de réinitialisation vient de vous être envoyé. Vérifiez votre boîte de réception (et vos spams).");
        } catch (error) {
            alert("Erreur : " + error.message);
        }
    });
}
// --- CHARGEMENT DES PRODUITS (Google Apps Script) ---
async function fetchProducts() {
    const cachedProducts = localStorage.getItem('morastyle_products');
    if (cachedProducts) {
        products = JSON.parse(cachedProducts);
        buildCategories();
        filterAndDisplay();
    }

    try {
        const response = await fetch(GAS_URL + "?action=getProducts");
        let rawData = await response.json();

        let newProducts = rawData.map((item, idx) => ({
            id: item.id || item.ID || (idx + 1),
            nom: item.nom || item.Nom || "Produit sans nom",
            prix: parseInt(item.prix || item.Prix || 0),
            unite: item.unite || item.Unite || "pièce",
            categorie: item.categorie || item.Categorie || item.rayon || item.Rayon || "Général",
            image: item.image || item.Image || "https://via.placeholder.com/150"
        }));

        if (JSON.stringify(products) !== JSON.stringify(newProducts)) {
            products = newProducts;
            localStorage.setItem('morastyle_products', JSON.stringify(products));
            buildCategories();
            filterAndDisplay();
        }
    } catch (error) {
        console.error("Erreur Fetch:", error);
    }
}

function buildCategories() {
    const categoryList = document.getElementById('category-list');
    if (!categoryList) return;
    const categories = [...new Set(products.map(p => p.categorie).filter(Boolean))];
    categoryList.innerHTML = '<li><a href="#" class="cat-link active" data-cat="all">Tous les produits</a></li>';
    categories.forEach(cat => {
        categoryList.innerHTML += `<li><a href="#" class="cat-link" data-cat="${cat}">${cat}</a></li>`;
    });

    document.querySelectorAll('.cat-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            currentCategory = link.getAttribute('data-cat');
            filterAndDisplay();
        });
    });
}

function displayProducts(listToDisplay) {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    productsContainer.innerHTML = "";
    
    listToDisplay.forEach(product => {
        productsContainer.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" alt="${product.nom}">
                <h3>${product.nom}</h3>
                <div class="price">${product.prix.toLocaleString()} Ar / ${product.unite}</div>
                <button onclick="addToCart(${product.id})">Ajouter au panier</button>
            </div>
        `;
    });
}

function filterAndDisplay() {
    let result = products;
    if (currentCategory !== 'all') {
        result = result.filter(p => p.categorie === currentCategory);
    }
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (searchTerm) {
        result = result.filter(p => p.nom.toLowerCase().includes(searchTerm));
    }
    displayProducts(result);
}

if(document.getElementById('search-input')) {
    document.getElementById('search-input').addEventListener('input', filterAndDisplay);
}

// --- GESTION DU PANIER ---
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    updateCartUI();
};

function updateCartUI() {
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";
    
    let subtotal = 0;
    cart.forEach((item, index) => {
        subtotal += item.prix * item.quantity;
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div><strong>${item.nom}</strong> (${item.prix.toLocaleString()} Ar)</div>
                <div>
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <span style="color:red; cursor:pointer; margin-left:10px;" onclick="removeFromCart(${index})">✕</span>
                </div>
            </div>
        `;
    });

    const totalToPay = subtotal + deliveryFee;
    if(document.getElementById('subtotal-price')) document.getElementById('subtotal-price').innerText = subtotal.toLocaleString();
    if(document.getElementById('delivery-price')) document.getElementById('delivery-price').innerText = deliveryFee.toLocaleString();
    if(document.getElementById('total-price')) document.getElementById('total-price').innerText = totalToPay.toLocaleString();
    if(document.getElementById('instruction-amount')) document.getElementById('instruction-amount').innerText = totalToPay.toLocaleString();
}

window.updateQuantity = function(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCartUI();
};
window.removeFromCart = function(index) { cart.splice(index, 1); updateCartUI(); };

document.getElementsByName('delivery').forEach(radio => {
    radio.addEventListener('change', (e) => { deliveryFee = parseInt(e.target.value); updateCartUI(); });
});

document.getElementsByName('payment-method').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (paymentNumbers[selected] && document.getElementById('instruction-number')) {
            document.getElementById('instruction-number').innerText = paymentNumbers[selected];
        }
    });
});

if(document.getElementById('cart-icon')) document.getElementById('cart-icon').addEventListener('click', () => document.getElementById('cart-modal').classList.remove('hidden'));
if(document.getElementById('close-cart')) document.getElementById('close-cart').addEventListener('click', () => document.getElementById('cart-modal').classList.add('hidden'));

// --- SOUMISSION COMMANDE (Google Apps Script) ---
async function submitOrder() {
    const btnSubmit = document.getElementById('btn-submit-order');
    if (!currentUser) {
        document.getElementById('cart-modal').classList.add('hidden');
        authModal.classList.remove('hidden');
        alert("Vous devez être connecté pour passer une commande.");
        return;
    }

    if (cart.length === 0) return alert("Votre panier est vide !");

    const clientPhone = document.getElementById('client-phone').value.trim();
    const clientAddress = document.getElementById('client-address').value.trim();
    const transactionRef = document.getElementById('transaction-ref').value.trim();
    
    let paymentMethod = "MVola";
    document.getElementsByName('payment-method').forEach(r => { if (r.checked) paymentMethod = r.value; });

    if (!clientPhone || !clientAddress || !transactionRef) {
        return alert("Veuillez remplir Téléphone, Adresse et Référence SMS !");
    }

    const subtotal = cart.reduce((sum, i) => sum + (i.prix * i.quantity), 0);
    const totalToPay = subtotal + deliveryFee;

    const orderData = {
        clientInfo: `${currentUser.nom} (${currentUser.email}) - Tél: ${clientPhone} - Adresse: ${clientAddress}`,
        items: cart.map(i => ({ nom: i.nom, quantite: i.quantity, prix: i.prix })),
        total: totalToPay,
        paymentMethod: paymentMethod,
        transactionRef: transactionRef
    };

    const payload = { action: 'saveOrder', orderData: orderData };

    try {
        btnSubmit.textContent = "Envoi en cours...";
        btnSubmit.disabled = true;

        const url = GAS_URL + "?action=saveOrder&payload=" + encodeURIComponent(JSON.stringify(payload));
        const response = await fetch(url, {
            method: 'GET'
        });

        const result = await response.json();

        if (result.status === 'success' || result.success) {
            const newOrder = {
                id: result.orderId || ("CMD-" + Date.now().toString().slice(-6)),
                date: new Date().toLocaleString('fr-FR'),
                client: { name: currentUser.nom, email: currentUser.email, phone: clientPhone, address: clientAddress },
                items: [...cart],
                total: totalToPay,
                paymentMethod: paymentMethod,
                transactionRef: transactionRef,
                paymentStatus: "En attente de vérification",
                deliveryStatus: "En attente"
            };

            orders.unshift(newOrder);
            localStorage.setItem('morastyle_orders', JSON.stringify(orders));
            
            cart = [];
            updateCartUI();
            document.getElementById('transaction-ref').value = "";
            document.getElementById('cart-modal').classList.add('hidden');
            
            alert(`🎉 Commande enregistrée ! ID : ${newOrder.id}`);
            
            switchTab('user-dashboard'); 
            
        } else {
            alert("Erreur lors de la commande : " + (result.message || "Erreur inconnue"));
        }
    } catch (error) {
        console.error("Erreur de connexion : ", error);
        alert("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
        btnSubmit.textContent = "Valider la commande";
        btnSubmit.disabled = false;
    }
}

if(document.getElementById('btn-submit-order')) {
    document.getElementById('btn-submit-order').addEventListener('click', submitOrder);
}

// --- ESPACE UTILISATEUR ---
function renderUserOrders() {
    const userOrdersBody = document.getElementById('user-orders-body');
    if (!userOrdersBody) return;
    userOrdersBody.innerHTML = "";

    if (!currentUser) return;

    const myOrders = orders.filter(order => order.client && order.client.email === currentUser.email);

    if (myOrders.length === 0) {
        userOrdersBody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding: 20px;'>Vous n'avez passé aucune commande pour le moment.</td></tr>";
        return;
    }

    myOrders.forEach(order => {
        const itemsList = order.items.map(i => `• ${i.nom} (x${i.quantity || i.quantite})`).join('<br>');
        
        let payColor = order.paymentStatus === 'Payé' ? 'green' : (order.paymentStatus === 'Refusé' ? 'red' : 'orange');
        let delivColor = order.deliveryStatus === 'Livré' ? 'green' : (order.deliveryStatus === 'En cours' ? 'blue' : 'orange');

        userOrdersBody.innerHTML += `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td><small>${order.date}</small></td>
                <td><small>${itemsList}</small></td>
                <td><strong>${order.total.toLocaleString()} Ar</strong></td>
                <td style="color: ${payColor}; font-weight: bold;">${order.paymentStatus || "En attente"}</td>
                <td style="color: ${delivColor}; font-weight: bold;">${order.deliveryStatus || "En attente"}</td>
            </tr>
        `;
    });
}

// --- ESPACE ADMIN ---
function renderAdminOrders() {
    const adminOrdersBody = document.getElementById('admin-orders-body');
    if (!adminOrdersBody) return;
    adminOrdersBody.innerHTML = "";

    if (orders.length === 0) {
        adminOrdersBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Aucune commande.</td></tr>";
        return;
    }

    orders.forEach((order, index) => {
        const itemsList = order.items.map(i => `${i.nom} (x${i.quantity || i.quantite})`).join('<br>');
        
        const clientName = order.client ? order.client.name : (order.clientInfo || "Inconnu");
        const clientPhone = order.client ? order.client.phone : "Non renseigné";
        const clientAddress = order.client ? order.client.address : "Non renseignée";

        adminOrdersBody.innerHTML += `
            <tr>
                <td><strong>${order.id}</strong><br><small>${order.date}</small></td>
                <td>
                    <strong>${clientName}</strong><br>
                    <small>📞 ${clientPhone}</small><br>
                    <small>📍 ${clientAddress}</small>
                </td>
                <td><small>${itemsList}</small></td>
                <td><strong>${order.paymentMethod || "MVola"}</strong><br>Réf: <code>${order.transactionRef || "-"}</code></td>
                <td><strong>${order.total.toLocaleString()} Ar</strong></td>
                <td>
                    <select class="status-select" onchange="syncOrderStatus(${index}, '${order.id}', 'paymentStatus', this.value)">
                        <option value="En attente de vérification" ${order.paymentStatus === 'En attente de vérification' ? 'selected' : ''}>⏳ En attente</option>
                        <option value="Payé" ${order.paymentStatus === 'Payé' ? 'selected' : ''}>✅ Payé</option>
                        <option value="Refusé" ${order.paymentStatus === 'Refusé' ? 'selected' : ''}>❌ Refusé</option>
                    </select>
                </td>
                <td>
                    <select class="status-select" onchange="syncOrderStatus(${index}, '${order.id}', 'deliveryStatus', this.value)">
                        <option value="En attente" ${order.deliveryStatus === 'En attente' ? 'selected' : ''}>🛑 En attente</option>
                        <option value="En cours" ${order.deliveryStatus === 'En cours' ? 'selected' : ''}>🚚 En cours</option>
                        <option value="Livré" ${order.deliveryStatus === 'Livré' ? 'selected' : ''}>🎉 Livré</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

window.syncOrderStatus = async function(index, orderId, statusType, newValue) {
    orders[index][statusType] = newValue;
    localStorage.setItem('morastyle_orders', JSON.stringify(orders));

    const payload = { action: "updateStatus", orderId: orderId, type: statusType, value: newValue };

    try {
        const url = GAS_URL + "?action=updateStatus&payload=" + encodeURIComponent(JSON.stringify(payload));
        const response = await fetch(url, {
            method: 'GET'
        });
        
        const result = await response.json();
        if(result.success) {
            console.log(`Commande ${orderId} : ${statusType} synchronisé avec succès.`);
        } else {
            alert("Erreur serveur : " + result.message);
        }
    } catch (err) {
        console.error("Erreur de synchronisation :", err);
        alert("Impossible de joindre Google Sheets. La modification n'est enregistrée qu'en local.");
    }
};

// --- GESTION DE LA MODALE "QUI SOMMES-NOUS ?" ET CLICS EXTERIEURS ---
const aboutModal = document.getElementById('about-modal');
const btnAbout = document.getElementById('btn-about');
const closeAbout = document.getElementById('close-about');

if (btnAbout && aboutModal) btnAbout.addEventListener('click', (e) => { e.preventDefault(); aboutModal.classList.remove('hidden'); });
if (closeAbout && aboutModal) closeAbout.addEventListener('click', () => aboutModal.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.add('hidden');
    if (e.target === authModal) authModal.classList.add('hidden');
    const cartModal = document.getElementById('cart-modal');
    if (e.target === cartModal) cartModal.classList.add('hidden');
});

// --- INIT ---
updateUIPerUser();
fetchProducts();