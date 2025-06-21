// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration - PROVIDED BY USER
const firebaseConfig = {
    apiKey: "AIzaSyDmIqnbd-nPxJ_4636iMC3E8GVaj68B5-g",
    authDomain: "app-finance-leoes.firebaseapp.com",
    projectId: "app-finance-leoes",
    storageBucket: "app-finance-leoes.firebasestorage.app",
    messagingSenderId: "924652655598",
    appId: "1:924652655598:web:7be0207a400361bbeef4ff"
};

let app;
let db;
let auth;
let userId = null;
let allTransactions = []; // Will store all transactions for use in reports
let expensesByCategoryChartInstance = null;
let incomeVsExpensesChartInstance = null;
let userCategories = []; // User-defined categories will be loaded here

// Define default categories
const DEFAULT_CATEGORIES = [
    { id: 'Salário', name: 'Salário' },
    { id: 'Alimentação', name: 'Alimentação' },
    { id: 'Transporte', name: 'Transporte' },
    { id: 'Moradia', name: 'Moradia' },
    { id: 'Lazer', name: 'Lazer' },
    { id: 'Saúde', name: 'Saúde' },
    { id: 'Educação', name: 'Educação' },
    { id: 'Outros', name: 'Outros' }
];


// UI Elements - Get references to all necessary HTML elements
const splashScreen = document.getElementById('splash-screen');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleToRegisterBtn = document.getElementById('toggle-to-register');
const toggleToLoginBtn = document.getElementById('toggle-to-login');
const loginAnonymousBtn = document.getElementById('login-anonymous');
const logoutButton = document.getElementById('logout-button');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');

const userNameDisplay = document.getElementById('user-name');
const userProfilePic = document.getElementById('user-profile-pic');
const userIdDisplay = document.getElementById('user-id-display');

// Navigation elements
const navDashboard = document.getElementById('nav-dashboard');
const navTransactions = document.getElementById('nav-transactions');
const navReports = document.getElementById('nav-reports');
const navProfile = document.getElementById('nav-profile');

const dashboardContent = document.getElementById('dashboard-content');
const transactionsContent = document.getElementById('transactions-content');
const reportsContent = document.getElementById('reports-content');
const profileContent = document.getElementById('profile-content');

const fabAddTransaction = document.getElementById('fab-add-transaction');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const viewAllTransactionsBtn = document.getElementById('view-all-transactions-btn');

// Transaction Modal elements
const transactionModal = document.getElementById('transaction-modal');
const transactionModalTitle = document.getElementById('transaction-modal-title');
const transactionForm = document.getElementById('transaction-form');
const transactionIdInput = document.getElementById('transaction-id');
const transactionTypeInput = document.getElementById('transaction-type');
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionDateInput = document.getElementById('transaction-date');
const transactionCategoryInput = document.getElementById('transaction-category');
const recentTransactionsList = document.getElementById('recent-transactions-list');
const transactionsList = document.getElementById('transactions-list');

// Goal Modal elements
const addGoalBtn = document.getElementById('add-goal-btn');
const financialGoalsList = document.getElementById('financial-goals-list');
const goalModal = document.getElementById('goal-modal');
const goalModalTitle = document.getElementById('goal-modal-title');
const goalForm = document.getElementById('goal-form');
const goalIdInput = document.getElementById('goal-id');
const goalNameInput = document.getElementById('goal-name');
const goalTargetAmountInput = document.getElementById('goal-target-amount');
const goalCurrentAmountInput = document.getElementById('goal-current-amount');
const goalDueDateInput = document.getElementById('goal-due-date');

// Category Modal elements
const manageCategoriesBtn = document.getElementById('manage-categories-btn');
const categoryModal = document.getElementById('category-modal');
const addCategoryForm = document.getElementById('add-category-form');
const newCategoryNameInput = document.getElementById('new-category-name');
const categoriesList = document.getElementById('categories-list');

// Profile Modal elements
const editProfileBtn = document.getElementById('edit-profile-btn');
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editProfileNameInput = document.getElementById('edit-profile-name');
const editProfilePhotoUrlInput = document.getElementById('edit-profile-photo-url');
const profilePicDisplay = document.getElementById('profile-pic-display');
const profileNameDisplay = document.getElementById('profile-name-display');
const profileEmailDisplay = document.getElementById('profile-email-display');

// Change Password Modal elements
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');

// Forgot Password Modal elements
const forgotPasswordModal = document.getElementById('forgot-password-modal');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotPasswordEmailInput = document.getElementById('forgot-password-email');

// Delete Account
const deleteAccountBtn = document.getElementById('delete-account-btn');

// Dashboard summary elements
const currentBalanceEl = document.getElementById('current-balance');
const monthlyIncomeEl = document.getElementById('monthly-income');
const monthlyExpensesEl = document.getElementById('monthly-expenses');
const estimatedSavingsEl = document.getElementById('estimated-savings');

// Notification elements
const notificationBox = document.getElementById('notification-box');
const notificationMessage = document.getElementById('notification-message');

// Confirmation Modal elements
const confirmationModal = document.getElementById('confirmation-modal');
const confirmationModalTitle = document.getElementById('confirmation-modal-title');
const confirmationModalMessage = document.getElementById('confirmation-modal-message');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmActionBtn = document.getElementById('confirm-action-btn');
const confirmationPasswordGroup = document.getElementById('confirmation-password-group');
const confirmationPasswordInput = document.getElementById('confirmation-password');

// Chart elements
const expensesByCategoryChartCtx = document.getElementById('expensesByCategoryChart')?.getContext('2d');
const incomeVsExpensesChartCtx = document.getElementById('incomeVsExpensesChart')?.getContext('2d');


// --- Utility Functions ---

/**
 * Displays a notification (toast) to the user.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - The type of notification for styling.
 */
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notificationBox.className = 'notification show'; // Reset classes
    if (type === 'success') {
        notificationBox.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notificationBox.style.backgroundColor = '#f44336';
    } else if (type === 'info') {
        notificationBox.style.backgroundColor = '#2196F3';
    }
    setTimeout(() => {
        notificationBox.classList.remove('show');
    }, 3000);
}

/**
 * Displays a specific section of the application (Login, Register, Main App).
 * @param {string} sectionId - The ID of the HTML section to display.
 */
function showSection(sectionId) {
    const sections = [loginSection, registerSection, appSection];
    sections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('flex'); // Remove flex when hidden
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('flex'); // Add flex when visible
    }
}

/**
 * Displays a specific part of the main application content (Dashboard, Transactions, etc.).
 * @param {string} contentId - The ID of the main content to display.
 */
function showAppContent(contentId) {
    const contents = [dashboardContent, transactionsContent, reportsContent, profileContent];
    contents.forEach(content => content.classList.add('hidden'));
    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }

    // Update active navigation link
    [navDashboard, navTransactions, navReports, navProfile].forEach(link => {
        link.classList.remove('text-indigo-600');
        link.classList.add('hover:text-indigo-600');
    });
    if (contentId === 'dashboard-content') navDashboard.classList.add('text-indigo-600');
    if (contentId === 'transactions-content') navTransactions.classList.add('text-indigo-600');
    if (contentId === 'reports-content') {
        navReports.classList.add('text-indigo-600');
        renderReports(allTransactions); // Render reports when entering the section
    }
    if (contentId === 'profile-content') navProfile.classList.add('text-indigo-600');

    // Show/hide FAB (Floating Action Button) based on content
    if (contentId === 'dashboard-content' || contentId === 'transactions-content') {
        fabAddTransaction.classList.remove('hidden');
    } else {
        fabAddTransaction.classList.add('hidden');
    }
}

/**
 * Opens a specific modal.
 * @param {string} modalId - The ID of the modal to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Closes a specific modal and resets its forms.
 * This function is globally accessible via `window.closeModal`.
 * @param {string} modalId - The ID of the modal to close.
 */
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset forms within the modal
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Hide password field in confirmation modal, if visible
        if (modalId === 'confirmation-modal') {
            confirmationPasswordGroup.classList.add('hidden');
            confirmationPasswordInput.value = '';
        }
    }
}

/**
 * Displays a custom confirmation modal.
 * @param {object} options - Options for the confirmation modal.
 * @param {string} options.title - Modal title.
 * @param {string} options.message - Confirmation message.
 * @param {string} [options.confirmText='Confirm'] - Text for the confirm button.
 * @param {string} [options.cancelText='Cancel'] - Text for the cancel button.
 * @param {boolean} [options.requirePassword=false] - Whether confirmation requires user password.
 * @returns {Promise<boolean>} A Promise that resolves to true if confirmed, false if cancelled.
 */
function showConfirmationModal({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', requirePassword = false }) {
    return new Promise((resolve) => {
        confirmationModalTitle.textContent = title;
        confirmationModalMessage.textContent = message;
        confirmActionBtn.textContent = confirmText;
        confirmCancelBtn.textContent = cancelText;

        if (requirePassword) {
            confirmationPasswordGroup.classList.remove('hidden');
            confirmationPasswordInput.value = ''; // Clear password field
        } else {
            confirmationPasswordGroup.classList.add('hidden');
        }

        openModal('confirmation-modal');

        const handleConfirm = () => {
            closeModal('confirmation-modal');
            resolve(true);
            cleanUpListeners();
        };

        const handleCancel = () => {
            closeModal('confirmation-modal');
            resolve(false);
            cleanUpListeners();
        };

        // Remove listeners to prevent multiple events
        const cleanUpListeners = () => {
            confirmActionBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };

        confirmActionBtn.addEventListener('click', handleConfirm, { once: true });
        confirmCancelBtn.addEventListener('click', handleCancel, { once: true });
    });
}


// --- Firebase Initialization and Authentication ---

async function initFirebase() {
    try {
        app = initializeApp(firebaseConfig); // Initialize Firebase with provided config
        db = getFirestore(app);
        auth = getAuth(app);

        // Authenticate with custom token or anonymously
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                userNameDisplay.textContent = user.displayName || 'Usuário';
                userProfilePic.src = user.photoURL || `https://placehold.co/80x80/6366f1/ffffff?text=${(user.displayName ? user.displayName.charAt(0) : 'U')}`;
                profilePicDisplay.src = user.photoURL || `https://placehold.co/120x120/6366f1/ffffff?text=${(user.displayName ? user.displayName.charAt(0) : 'U')}`;
                profileNameDisplay.textContent = user.displayName || 'Usuário';
                profileEmailDisplay.textContent = user.email || 'Anonimous User';
                userIdDisplay.textContent = `ID: ${userId}`;
                showSection('app-section');
                showAppContent('dashboard-content');
                await loadUserData();
                setupRealtimeListeners();
                // Hide splash screen after successful auth and data load
                splashScreen.style.opacity = '0';
                setTimeout(() => splashScreen.classList.add('hidden'), 500);
            } else {
                userId = null;
                showSection('login-section');
                // Hide splash screen if not logged in
                splashScreen.style.opacity = '0';
                setTimeout(() => splashScreen.classList.add('hidden'), 500);
            }
        });
    } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        showNotification(`Erro ao iniciar o app: ${error.message}`, 'error');
        // Hide splash screen even if there's an error
        splashScreen.style.opacity = '0';
        setTimeout(() => splashScreen.classList.add('hidden'), 500);
    }
}

// --- User Data Management (Firestore) ---

/**
 * Loads user profile data from Firestore.
 */
async function loadUserData() {
    if (!userId) return;

    const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/profile`, 'data');
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.name) {
                userNameDisplay.textContent = userData.name;
                profileNameDisplay.textContent = userData.name;
            }
            if (userData.photoURL) {
                userProfilePic.src = userData.photoURL;
                profilePicDisplay.src = userData.photoURL;
            }
            // Update current Firebase Auth profile if necessary
            if (auth.currentUser && (auth.currentUser.displayName !== userData.name || auth.currentUser.photoURL !== userData.photoURL)) {
                await updateProfile(auth.currentUser, {
                    displayName: userData.name,
                    photoURL: userData.photoURL
                });
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        showNotification(`Erro ao carregar perfil: ${error.message}`, 'error');
    }
}

/**
 * Saves/updates user profile data in Firestore and Firebase Authentication.
 * @param {string} name - User's name.
 * @param {string} photoURL - URL of the profile picture.
 */
async function saveUserProfile(name, photoURL) {
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }
    const userDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/profile`, 'data');
    try {
        await setDoc(userDocRef, { name, photoURL }, { merge: true });
        // Also update Firebase Auth profile
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name, photoURL: photoURL });
        }
        showNotification("Perfil atualizado com sucesso!", "success");
        userNameDisplay.textContent = name;
        profileNameDisplay.textContent = name;
        userProfilePic.src = photoURL || `https://placehold.co/80x80/6366f1/ffffff?text=${(name ? name.charAt(0) : 'U')}`;
        profilePicDisplay.src = photoURL || `https://placehold.co/120x120/6366f1/ffffff?text=${(name ? name.charAt(0) : 'U')}`;
        closeModal('edit-profile-modal');
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        showNotification(`Erro ao salvar perfil: ${error.message}`, 'error');
    }
}

// --- Realtime Listeners ---
let unsubscribeTransactions = null;
let unsubscribeGoals = null;
let unsubscribeCategories = null;

/**
 * Sets up real-time listeners for user transactions, goals, and categories in Firestore.
 */
function setupRealtimeListeners() {
    // Detach previous listeners to prevent duplication
    if (unsubscribeTransactions) unsubscribeTransactions();
    if (unsubscribeGoals) unsubscribeGoals();
    if (unsubscribeCategories) unsubscribeCategories();

    if (!userId) return;

    // Listener for Transactions
    const transactionsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/transactions`);
    const qTransactions = query(transactionsColRef, orderBy('date', 'desc')); // Order by date descending

    unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
        allTransactions = []; // Clear array before populating
        snapshot.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data() });
        });
        renderTransactions(allTransactions);
        updateDashboardSummary(allTransactions);
        // Re-render reports if the section is active
        if (!reportsContent.classList.contains('hidden')) {
            renderReports(allTransactions);
        }
    }, (error) => {
        console.error("Erro ao ouvir transações:", error);
        showNotification(`Erro ao carregar transações em tempo real: ${error.message}`, 'error');
    });

    // Listener for Financial Goals
    const goalsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/goals`);
    const qGoals = query(goalsColRef, orderBy('createdAt', 'desc')); // Order by creation date

    unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({ id: doc.id, ...doc.data() });
        });
        renderGoals(goals);
    }, (error) => {
        console.error("Erro ao ouvir metas:", error);
        showNotification(`Erro ao carregar metas em tempo real: ${error.message}`, 'error');
    });

    // Listener for Categories
    const categoriesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/categories`);
    const qCategories = query(categoriesColRef, orderBy('name', 'asc')); // Order by name

    unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
        const fetchedCategories = [];
        snapshot.forEach(doc => {
            fetchedCategories.push({ id: doc.id, ...doc.data() });
        });
        // Merge default categories with user's custom ones
        userCategories = [...DEFAULT_CATEGORIES, ...fetchedCategories];
        populateTransactionCategoriesDropdown(userCategories); // Update the dropdown
        renderCategories(userCategories); // Render categories in the management modal
    }, (error) => {
        console.error("Erro ao ouvir categorias:", error);
        showNotification(`Erro ao carregar categorias em tempo real: ${error.message}`, 'error');
    });
}


/**
 * Populates the categories dropdown in the transaction modal.
 * @param {Array<Object>} categories - Array of category objects.
 */
function populateTransactionCategoriesDropdown(categories) {
    transactionCategoryInput.innerHTML = ''; // Clear existing options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        transactionCategoryInput.appendChild(option);
    });
}


// --- Render Functions ---

/**
 * Renders transactions in the recent transactions list and the full list.
 * @param {Array<Object>} transactions - Array of transaction objects.
 */
function renderTransactions(transactions) {
    recentTransactionsList.innerHTML = '';
    transactionsList.innerHTML = '';

    if (transactions.length === 0) {
        recentTransactionsList.innerHTML = '<p class="text-gray-500 text-center">Nenhuma transação recente.</p>';
        transactionsList.innerHTML = '<p class="text-gray-500 text-center">Nenhuma transação registrada.</p>';
        return;
    }

    // Render recent transactions (e.g., first 5)
    transactions.slice(0, 5).forEach(transaction => {
        recentTransactionsList.appendChild(createTransactionElement(transaction, true));
    });
    // Add "View All Transactions" button if there are more than 5
    if (transactions.length > 5 || (transactions.length > 0 && recentTransactionsList.querySelector('#view-all-transactions-btn-dashboard') === null)) {
        let existingBtn = document.getElementById('view-all-transactions-btn-dashboard');
        if (!existingBtn) {
            const btnContainer = document.createElement('div');
            btnContainer.innerHTML = `<button id="view-all-transactions-btn-dashboard" class="btn btn-secondary w-full mt-6"><i class="fas fa-eye mr-2"></i>Ver Todas as Transações</button>`;
            existingBtn = btnContainer.firstChild;
            recentTransactionsList.appendChild(existingBtn);
        }
        existingBtn.addEventListener('click', () => {
            showAppContent('transactions-content');
        });
    }


    // Render all transactions
    transactions.forEach(transaction => {
        transactionsList.appendChild(createTransactionElement(transaction, false));
    });
}

/**
 * Creates an HTML element for a transaction.
 * @param {Object} transaction - Transaction object.
 * @param {boolean} isRecent - Indicates if it's a recent transaction (for specific styling or logic).
 * @returns {HTMLElement} The HTML element of the transaction.
 */
function createTransactionElement(transaction, isRecent = false) {
    const item = document.createElement('div');
    item.className = 'transaction-item bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors duration-200';

    const amountClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
    const sign = transaction.type === 'income' ? '+' : '-';
    const icon = transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';

    const date = new Date(transaction.date + 'T00:00:00'); // Add T00:00:00 to ensure date is interpreted in UTC and avoid timezone issues
    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    item.innerHTML = `
        <div class="flex items-center">
            <div class="p-2 mr-3 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'} text-${transaction.type === 'income' ? 'green' : 'red'}-600">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <p class="font-medium text-gray-800">${transaction.description}</p>
                <p class="text-sm text-gray-500">${transaction.category} - ${formattedDate}</p>
            </div>
        </div>
        <div class="flex items-center">
            <p class="font-bold ${amountClass} text-lg mr-4">${sign} R$ ${parseFloat(transaction.amount).toFixed(2)}</p>
            <div class="flex space-x-2">
                <button class="text-blue-500 hover:text-blue-700 edit-transaction-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 hover:text-red-700 delete-transaction-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;

    item.querySelector('.edit-transaction-btn').addEventListener('click', () => editTransaction(transaction));
    item.querySelector('.delete-transaction-btn').addEventListener('click', () => deleteTransaction(transaction.id));

    return item;
}

/**
 * Updates summary values on the dashboard.
 * @param {Array<Object>} transactions - Array of transaction objects.
 */
function updateDashboardSummary(transactions) {
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions.forEach(t => {
        const amount = parseFloat(t.amount);
        const transactionDate = new Date(t.date + 'T00:00:00'); // Ensure consistent timezone

        if (t.type === 'income') {
            totalBalance += amount;
        } else {
            totalBalance -= amount;
        }

        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            if (t.type === 'income') {
                monthlyIncome += amount;
            } else {
                monthlyExpenses += amount;
            }
        }
    });

    currentBalanceEl.textContent = `R$ ${totalBalance.toFixed(2)}`;
    monthlyIncomeEl.textContent = `R$ ${monthlyIncome.toFixed(2)}`;
    monthlyExpensesEl.textContent = `R$ ${monthlyExpenses.toFixed(2)}`;
    estimatedSavingsEl.textContent = `R$ ${(monthlyIncome - monthlyExpenses).toFixed(2)}`;

    // Apply color based on balance
    if (totalBalance >= 0) {
        currentBalanceEl.parentElement.classList.remove('from-red-400', 'to-red-600');
        currentBalanceEl.parentElement.classList.add('from-green-400', 'to-green-600');
    } else {
        currentBalanceEl.parentElement.classList.remove('from-green-400', 'to-green-600');
        currentBalanceEl.parentElement.classList.add('from-red-400', 'to-red-600');
    }
}

/**
 * Renders financial goals in the list.
 * @param {Array<Object>} goals - Array of goal objects.
 */
function renderGoals(goals) {
    financialGoalsList.innerHTML = '';

    if (goals.length === 0) {
        financialGoalsList.innerHTML = '<p class="text-gray-500 text-center">Nenhuma meta definida ainda.</p>';
        return;
    }

    goals.forEach(goal => {
        const item = document.createElement('div');
        item.className = 'goal-item bg-white p-4 rounded-lg shadow-sm border border-gray-200';

        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const formattedProgress = Math.min(100, Math.max(0, progress)).toFixed(1); // Ensures between 0 and 100
        const remaining = goal.targetAmount - goal.currentAmount;
        const dueDate = goal.dueDate ? new Date(goal.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data limite';

        item.innerHTML = `
            <div class="flex-1">
                <p class="font-bold text-lg text-gray-800 mb-1">${goal.name}</p>
                <p class="text-sm text-gray-600">Alvo: R$ ${parseFloat(goal.targetAmount).toFixed(2)} | Atual: R$ ${parseFloat(goal.currentAmount).toFixed(2)}</p>
                <p class="text-sm text-gray-500">Restante: R$ ${remaining.toFixed(2)} | Prazo: ${dueDate}</p>
                <div class="progress-bar-container mt-2">
                    <div class="progress-bar" style="width: ${formattedProgress}%;"></div>
                </div>
                <p class="text-right text-sm text-gray-700 mt-1">${formattedProgress}% Concluído</p>
            </div>
            <div class="flex space-x-2 ml-4">
                <button class="text-blue-500 hover:text-blue-700 edit-goal-btn" data-id="${goal.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-500 hover:text-red-700 delete-goal-btn" data-id="${goal.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        item.querySelector('.edit-goal-btn').addEventListener('click', () => editGoal(goal));
        item.querySelector('.delete-goal-btn').addEventListener('click', () => deleteGoal(goal.id));
        financialGoalsList.appendChild(item);
    });
}

/**
 * Renders the list of categories in the management modal.
 * @param {Array<Object>} categories - Array of category objects.
 */
function renderCategories(categories) {
    categoriesList.innerHTML = '';

    // Filter out default categories to prevent direct editing/deletion
    const customCategories = categories.filter(cat => !DEFAULT_CATEGORIES.some(defaultCat => defaultCat.id === cat.id));

    if (customCategories.length === 0) {
        categoriesList.innerHTML = '<p class="text-gray-500 text-center">Nenhuma categoria personalizada.</p>';
        return;
    }

    customCategories.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-item bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors duration-200';
        item.innerHTML = `
            <p class="font-medium text-gray-800">${category.name}</p>
            <button class="text-red-500 hover:text-red-700 delete-category-btn" data-id="${category.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        item.querySelector('.delete-category-btn').addEventListener('click', () => deleteCategory(category.id, category.name));
        categoriesList.appendChild(item);
    });
}

/**
 * Renders the report charts.
 * @param {Array<Object>} transactions - All user transactions.
 */
function renderReports(transactions) {
    // Destroy existing chart instances before creating new ones to avoid memory leaks
    if (expensesByCategoryChartInstance) {
        expensesByCategoryChartInstance.destroy();
    }
    if (incomeVsExpensesChartInstance) {
        incomeVsExpensesChartInstance.destroy();
    }

    // 1. Expenses by Category (Current Month - Doughnut Chart)
    const currentMonthExpenses = transactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        const now = new Date();
        return t.type === 'expense' &&
               transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear();
    });

    const expensesByCategory = currentMonthExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
    }, {});

    const expenseLabels = Object.keys(expensesByCategory);
    const expenseData = Object.values(expensesByCategory);
    const expenseColors = expenseLabels.map((_, i) => `hsl(${i * 60}, 70%, 60%)`); // Dynamic colors

    if (expensesByCategoryChartCtx) {
        expensesByCategoryChartInstance = new Chart(expensesByCategoryChartCtx, {
            type: 'doughnut',
            data: {
                labels: expenseLabels,
                datasets: [{
                    data: expenseData,
                    backgroundColor: expenseColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Despesas por Categoria'
                    }
                }
            }
        });
    }


    // 2. Income vs Expenses (Last 6 Months - Bar Chart)
    const monthlyData = {};
    const today = new Date();
    for (let i = 0; i < 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthYear = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        monthlyData[monthYear] = { income: 0, expense: 0 };
    }

    transactions.forEach(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        const monthYear = transactionDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (monthlyData[monthYear]) {
            if (t.type === 'income') {
                monthlyData[monthYear].income += parseFloat(t.amount);
            } else {
                monthlyData[monthYear].expense += parseFloat(t.amount);
            }
        }
    });

    const months = Object.keys(monthlyData).reverse(); // To display from oldest to newest
    const incomeValues = months.map(month => monthlyData[month].income);
    const expenseValues = months.map(month => monthlyData[month].expense);

    if (incomeVsExpensesChartCtx) {
        incomeVsExpensesChartInstance = new Chart(incomeVsExpensesChartCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Receitas',
                        data: incomeValues,
                        backgroundColor: '#10b981', // Emerald-500
                        borderColor: '#059669',
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: expenseValues,
                        backgroundColor: '#ef4444', // Red-500
                        borderColor: '#dc2626',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Receitas vs Despesas'
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}


// --- Event Listeners and Form Submissions ---

// Authentication Forms
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification("Login realizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro no login:", error);
        showNotification(`Erro no login: ${error.message}`, 'error');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const photoURL = document.getElementById('register-photo-url').value;

    if (password !== confirmPassword) {
        showNotification("As senhas não coincidem!", "error");
        return;
    }
    if (password.length < 6) {
        showNotification("A senha deve ter no mínimo 6 caracteres.", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: photoURL || null // Set to null if empty string
        });
        // Save user data to Firestore
        await saveUserProfile(name, photoURL || '');
        showNotification("Cadastro realizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro no cadastro:", error);
        showNotification(`Erro no cadastro: ${error.message}`, 'error');
    }
});

toggleToRegisterBtn.addEventListener('click', () => {
    showSection('register-section');
});

toggleToLoginBtn.addEventListener('click', () => {
    showSection('login-section');
});

loginAnonymousBtn.addEventListener('click', async () => {
    try {
        await signInAnonymously(auth);
        showNotification("Login anônimo realizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro no login anônimo:", error);
        showNotification(`Erro no login anônimo: ${error.message}`, 'error');
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showNotification("Logout realizado com sucesso!", "success");
        // Detach all listeners on logout
        if (unsubscribeTransactions) unsubscribeTransactions();
        if (unsubscribeGoals) unsubscribeGoals();
        if (unsubscribeCategories) unsubscribeCategories();

        // Destroy chart instances on logout
        if (expensesByCategoryChartInstance) {
            expensesByCategoryChartInstance.destroy();
            expensesByCategoryChartInstance = null;
        }
        if (incomeVsExpensesChartInstance) {
            incomeVsExpensesChartInstance.destroy();
            incomeVsExpensesChartInstance = null;
        }
    } catch (error) {
        console.error("Erro no logout:", error);
        showNotification(`Erro no logout: ${error.message}`, 'error');
    }
});

// New: Forgot Password functionality
forgotPasswordBtn.addEventListener('click', () => {
    openModal('forgot-password-modal');
});

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotPasswordEmailInput.value;
    try {
        await sendPasswordResetEmail(auth, email);
        showNotification("Um link de redefinição de senha foi enviado para o seu e-mail!", "success");
        closeModal('forgot-password-modal');
    } catch (error) {
        console.error("Erro ao enviar link de redefinição de senha:", error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
});

// Navigation
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showAppContent('dashboard-content');
});
navTransactions.addEventListener('click', (e) => {
    e.preventDefault();
    showAppContent('transactions-content');
});
navReports.addEventListener('click', (e) => {
    e.preventDefault();
    showAppContent('reports-content');
});
navProfile.addEventListener('click', (e) => {
    e.preventDefault();
    showAppContent('profile-content');
});


// Transaction Management
fabAddTransaction.addEventListener('click', () => {
    openAddTransactionModal();
});
addTransactionBtn.addEventListener('click', () => {
    openAddTransactionModal();
});

/**
 * Opens the modal to add a new transaction.
 */
function openAddTransactionModal() {
    transactionModalTitle.textContent = 'Adicionar Transação';
    transactionForm.reset();
    transactionIdInput.value = ''; // Clear ID for new transaction
    const today = new Date().toISOString().split('T')[0];
    transactionDateInput.value = today; // Set default date to today
    populateTransactionCategoriesDropdown(userCategories); // Reload categories
    openModal('transaction-modal');
}

/**
 * Adds or updates a transaction in Firestore.
 * @param {Event} e - The form submission event.
 */
async function addOrUpdateTransaction(e) {
    e.preventDefault();
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    const transactionId = transactionIdInput.value;
    const type = transactionTypeInput.value;
    const description = transactionDescriptionInput.value;
    const amount = parseFloat(transactionAmountInput.value);
    const date = transactionDateInput.value; // Format:YYYY-MM-DD
    const category = transactionCategoryInput.value;

    if (isNaN(amount) || amount <= 0) {
        showNotification("Por favor, insira um valor válido e positivo.", "error");
        return;
    }

    const transactionData = {
        type,
        description,
        amount,
        date,
        category,
        createdAt: new Date().toISOString()
    };

    const transactionsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/transactions`);

    try {
        if (transactionId) {
            // Update existing transaction
            const transactionDocRef = doc(transactionsColRef, transactionId);
            await updateDoc(transactionDocRef, transactionData);
            showNotification("Transação atualizada com sucesso!", "success");
        } else {
            // Add new transaction
            await addDoc(transactionsColRef, transactionData);
            showNotification("Transação adicionada com sucesso!", "success");
        }
        closeModal('transaction-modal');
    } catch (error) {
        console.error("Erro ao salvar transação:", error);
        showNotification(`Erro ao salvar transação: ${error.message}`, 'error');
    }
}
transactionForm.addEventListener('submit', addOrUpdateTransaction);

/**
 * Opens the modal to edit an existing transaction, pre-filling the fields.
 * @param {Object} transaction - The transaction object to edit.
 */
function editTransaction(transaction) {
    transactionModalTitle.textContent = 'Editar Transação';
    transactionIdInput.value = transaction.id;
    transactionTypeInput.value = transaction.type;
    transactionDescriptionInput.value = transaction.description;
    transactionAmountInput.value = transaction.amount;
    transactionDateInput.value = transaction.date;
    transactionCategoryInput.value = transaction.category;
    populateTransactionCategoriesDropdown(userCategories); // Reload categories before selecting
    transactionCategoryInput.value = transaction.category; // Select the correct category
    openModal('transaction-modal');
}

/**
 * Deletes a transaction from Firestore after confirmation.
 * @param {string} id - The ID of the transaction to delete.
 */
async function deleteTransaction(id) {
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    const confirmed = await showConfirmationModal({
        title: "Excluir Transação",
        message: "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
        confirmText: "Excluir",
        cancelText: "Manter",
        requirePassword: false // Transactions do not require password for deletion
    });

    if (!confirmed) return;

    const transactionDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/transactions`, id);
    try {
        await deleteDoc(transactionDocRef);
        showNotification("Transação excluída com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir transação:", error);
        showNotification(`Erro ao excluir transação: ${error.message}`, 'error');
    }
}

// Goal Management
addGoalBtn.addEventListener('click', () => {
    openAddGoalModal();
});

/**
 * Opens the modal to add or edit a goal.
 * @param {Object} [goal] - The goal object to edit (optional).
 */
function openAddGoalModal(goal = null) {
    goalForm.reset();
    if (goal) {
        goalModalTitle.textContent = 'Editar Meta';
        goalIdInput.value = goal.id;
        goalNameInput.value = goal.name;
        goalTargetAmountInput.value = goal.targetAmount;
        goalCurrentAmountInput.value = goal.currentAmount;
        goalDueDateInput.value = goal.dueDate || '';
    } else {
        goalModalTitle.textContent = 'Adicionar Nova Meta';
        goalIdInput.value = '';
        goalCurrentAmountInput.value = '0.00'; // Default to 0 for new goal
        // No default due date for new goals
        goalDueDateInput.value = '';
    }
    openModal('goal-modal');
}

goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    const goalId = goalIdInput.value;
    const name = goalNameInput.value;
    const targetAmount = parseFloat(goalTargetAmountInput.value);
    const currentAmount = parseFloat(goalCurrentAmountInput.value);
    const dueDate = goalDueDateInput.value;

    if (isNaN(targetAmount) || targetAmount <= 0) {
        showNotification("Por favor, insira um valor alvo válido e positivo.", "error");
        return;
    }
    if (isNaN(currentAmount) || currentAmount < 0) {
        showNotification("Por favor, insira um valor atual válido e não negativo.", "error");
        return;
    }
    if (currentAmount > targetAmount) {
        showNotification("O valor atual não pode ser maior que o valor alvo.", "error");
        return;
    }

    const goalData = {
        name,
        targetAmount,
        currentAmount,
        dueDate: dueDate || null,
        createdAt: goalId ? undefined : new Date().toISOString() // Add createdAt only for new goals
    };

    const goalsColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/goals`);

    try {
        if (goalId) {
            const goalDocRef = doc(goalsColRef, goalId);
            await updateDoc(goalDocRef, goalData);
            showNotification("Meta atualizada com sucesso!", "success");
        } else {
            await addDoc(goalsColRef, goalData);
            showNotification("Meta adicionada com sucesso!", "success");
        }
        closeModal('goal-modal');
    } catch (error) {
        console.error("Erro ao salvar meta:", error);
        showNotification(`Erro ao salvar meta: ${error.message}`, 'error');
    }
});

function editGoal(goal) {
    openAddGoalModal(goal);
}

async function deleteGoal(id) {
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    const confirmed = await showConfirmationModal({
        title: "Excluir Meta",
        message: "Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.",
        confirmText: "Excluir",
        cancelText: "Manter",
        requirePassword: false
    });

    if (!confirmed) return;

    const goalDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/goals`, id);
    try {
        await deleteDoc(goalDocRef);
        showNotification("Meta excluída com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir meta:", error);
        showNotification(`Erro ao excluir meta: ${error.message}`, 'error');
    }
}

// Category Management
manageCategoriesBtn.addEventListener('click', () => {
    openModal('category-modal');
    renderCategories(userCategories); // Ensure the list is updated when opened
});

addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    const newCategoryName = newCategoryNameInput.value.trim();
    if (!newCategoryName) {
        showNotification("Por favor, digite um nome para a categoria.", "error");
        return;
    }

    // Check if category already exists (case-insensitive)
    const categoryExists = userCategories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase());
    if (categoryExists) {
        showNotification("Esta categoria já existe!", "info");
        return;
    }

    const categoriesColRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/categories`);
    try {
        await addDoc(categoriesColRef, { name: newCategoryName, createdAt: new Date().toISOString() });
        showNotification("Categoria adicionada com sucesso!", "success");
        newCategoryNameInput.value = ''; // Clear the field
    } catch (error) {
        console.error("Erro ao adicionar categoria:", error);
        showNotification(`Erro ao adicionar categoria: ${error.message}`, 'error');
    }
});

async function deleteCategory(id, name) {
    if (!userId) {
        showNotification("Erro: Usuário não autenticado.", "error");
        return;
    }

    // Prevent deletion of default categories
    if (DEFAULT_CATEGORIES.some(cat => cat.id === name || cat.name === name)) {
         showNotification("Não é possível excluir categorias padrão.", "info");
         return;
    }

    const confirmed = await showConfirmationModal({
        title: "Excluir Categoria",
        message: `Tem certeza que deseja excluir a categoria "${name}"? Isso não removerá transações existentes, mas a categoria não aparecerá mais.`,
        confirmText: "Excluir",
        cancelText: "Manter",
        requirePassword: false
    });

    if (!confirmed) return;

    const categoryDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/categories`, id);
    try {
        await deleteDoc(categoryDocRef);
        showNotification("Categoria excluída com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        showNotification(`Erro ao excluir categoria: ${error.message}`, 'error');
    }
}


// Profile Management
editProfileBtn.addEventListener('click', () => {
    if (auth.currentUser) {
        editProfileNameInput.value = auth.currentUser.displayName || '';
        editProfilePhotoUrlInput.value = auth.currentUser.photoURL || '';
    }
    openModal('edit-profile-modal');
});

editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = editProfileNameInput.value;
    const newPhotoURL = editProfilePhotoUrlInput.value;
    await saveUserProfile(newName, newPhotoURL);
});

changePasswordBtn.addEventListener('click', () => {
    openModal('change-password-modal');
});

changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    if (newPassword !== confirmNewPassword) {
        showNotification("As novas senhas não coincidem!", "error");
        return;
    }
    if (newPassword.length < 6) {
        showNotification("A nova senha deve ter no mínimo 6 caracteres.", "error");
        return;
    }
    if (!currentUser.email) {
        showNotification("Não é possível alterar a senha para usuários anônimos ou sem email.", "info");
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        showNotification("Senha alterada com sucesso!", "success");
        closeModal('change-password-modal');
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        showNotification(`Erro ao alterar senha: ${error.message}`, 'error');
    }
});

deleteAccountBtn.addEventListener('click', async () => {
    if (!userId) {
        showNotification("Nenhum usuário logado para excluir.", "error");
        return;
    }

    const currentUser = auth.currentUser;
    let confirmed = false;
    let passwordToConfirm = '';

    // If it's an email/password user, ask for password confirmation
    if (currentUser.providerData.some(provider => provider.providerId === 'password')) {
        confirmed = await showConfirmationModal({
            title: "Excluir Conta Permanentemente",
            message: "ATENÇÃO: Tem certeza que deseja EXCLUIR sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.",
            confirmText: "Sim, Excluir",
            cancelText: "Não, Manter",
            requirePassword: true
        });
        passwordToConfirm = confirmationPasswordInput.value; // Get password from modal
    } else {
        // For anonymous users, just click confirmation
        confirmed = await showConfirmationModal({
            title: "Excluir Conta Permanentemente",
            message: "ATENÇÃO: Tem certeza que deseja EXCLUIR sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.",
            confirmText: "Sim, Excluir",
            cancelText: "Não, Manter",
            requirePassword: false
        });
    }


    if (!confirmed) {
        showNotification("Exclusão de conta cancelada.", "info");
        return;
    }

    try {
        // If it's an email/password user, re-authenticate first
        if (currentUser.providerData.some(provider => provider.providerId === 'password')) {
            if (!passwordToConfirm) {
                showNotification("Senha necessária para excluir a conta.", "error");
                return;
            }
            const credential = EmailAuthProvider.credential(currentUser.email, passwordToConfirm);
            await reauthenticateWithCredential(currentUser, credential);
        }

        // Delete all user's data from Firestore first
        const transactionsCollection = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/transactions`);
        const transactionsSnapshot = await getDocs(transactionsCollection);
        transactionsSnapshot.forEach(async (docRef) => {
            await deleteDoc(docRef.ref);
        });

        const goalsCollection = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/goals`);
        const goalsSnapshot = await getDocs(goalsCollection);
        goalsSnapshot.forEach(async (docRef) => {
            await deleteDoc(docRef.ref);
        });

        const categoriesCollection = collection(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/categories`);
        const categoriesSnapshot = await getDocs(categoriesCollection);
        categoriesSnapshot.forEach(async (docRef) => {
            await deleteDoc(docRef.ref);
        });

        const userProfileDoc = doc(db, `artifacts/${firebaseConfig.projectId}/users/${userId}/profile`, 'data');
        await deleteDoc(userProfileDoc);

        await currentUser.delete();
        showNotification("Conta excluída com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir conta:", error);
        showNotification(`Erro ao excluir conta: ${error.message}`, 'error');
    }
});

// Initialize Firebase on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initFirebase);
