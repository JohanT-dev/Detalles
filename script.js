// Configuración de Firebase (REEMPLAZA CON TUS CREDENCIALES)
const firebaseConfig = {
    apiKey: "AIzaSyDjElCiSGJNkMMhlDruX6N9FiTYUay0hr0",
    authDomain: "fir-proyect-johan.firebaseapp.com",
    projectId: "fir-proyect-johan",
    storageBucket: "fir-proyect-johan.rebasestorage.app",
    messagingSenderId: "1088410162010",
    appId: "1:1088410162010:web:5284e59b95fc1710bc1963",
    measurementId: "G-K4FTJDRMJB"
};

// Inicializar Firebase
let db;
let isFirebaseConfigured = false;
let isAppInitialized = false;

async function initializeFirebase() {
    try {
        if (!isAppInitialized) {
            firebase.initializeApp(firebaseConfig);
            isAppInitialized = true;
        }
        db = firebase.firestore();
        
        // Hacer una pequeña prueba de conexión
        await db.collection('products').limit(1).get();
        isFirebaseConfigured = true;
        console.log('✅ Firebase configurado correctamente');
        return true;
    } catch (error) {
        console.warn('❌ Firebase no configurado correctamente:', error);
        isFirebaseConfigured = false;
        return false;
    }
}

// Variables globales
let products = [];
const productsGrid = document.getElementById('productsGrid');
const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productName');
const addBtn = document.getElementById('addBtn');
const messagesDiv = document.getElementById('messages');
const loadingDiv = document.getElementById('loading');

// Función para mostrar mensajes
function showMessage(message, type = 'success') {
    messagesDiv.innerHTML = `
        <div class="${type}-message">
            ${message}
        </div>
    `;
    setTimeout(() => {
        messagesDiv.innerHTML = '';
    }, 3000);
}

// Función para generar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Función para crear una tarjeta de producto
function createProductCard(product) {
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="flower">
                <div class="mid"></div>
                <div class="Petal1 p1"></div>
                <div class="Petal1 p2"></div>
                <div class="Petal1 p3"></div>
                <div class="Petal1 p4"></div>
                <div class="Petal2 p1"></div>
                <div class="Petal2 p2"></div>
                <div class="Petal2 p3"></div>
                <div class="Petal2 p4"></div>
                <div class="Petal3 p1"></div>
                <div class="Petal3 p2"></div>
                <div class="Petal3 p3"></div>
                <div class="Petal3 p4"></div>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
            </div>
        </div>
    `;
}

// Función para renderizar productos
function renderProducts() {
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7); padding: 40px;">
                <div style="font-size: 4em; margin-bottom: 20px;">🌻</div>
                <h3>No hay flores aún en el jardín</h3>
                <p>Es que las flores estan caras...</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Función para añadir producto
async function addProduct(name) {
    const newProduct = {
        id: generateId(),
        name: name.trim(),
        createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
        try {
            await db.collection('products').doc(newProduct.id).set(newProduct);
            products.push(newProduct);
            showMessage(`🌻 Felicidades "${name}", tu flor se ha añadido al jardín`);
        } catch (error) {
            console.error('Error añadiendo producto:', error);
            showMessage(`❌ Lo siento, parece que tengo este problema: ${error.message}`, 'error');
            return;
        }
    } else {
        // Almacenamiento local como fallback
        products.push(newProduct);
        try {
            localStorage.setItem('products', JSON.stringify(products));
            showMessage(`🌻 Felicidades "${name}", tu flor se ha añadido al jardín (modo local)`);
        } catch (error) {
            showMessage(`❌ Lo siento, parece que tengo este problema: ${error.message}`, 'error');
        }
    }
}

// Función mejorada para cargar productos
async function loadProducts(forceReload = false) {
    // Mostrar loading
    loadingDiv.style.display = 'block';
    
    try {
        if (isFirebaseConfigured) {
            console.log('🔄 Cargando productos desde Firebase...');
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            products = [];
            
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`✅ Se cargaron ${products.length} productos desde Firebase`);
            
            // Guardar en localStorage como respaldo
            try {
                localStorage.setItem('products', JSON.stringify(products));
            } catch (error) {
                console.warn('No se pudo guardar respaldo en localStorage');
            }
            
        } else {
            // Fallback: cargar desde localStorage
            console.log('📱 Cargando productos desde almacenamiento local...');
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                products = JSON.parse(savedProducts);
                console.log(`✅ Se cargaron ${products.length} productos desde localStorage`);
            } else {
                products = [];
                console.log('ℹ️ No hay productos guardados localmente');
            }
        }
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showMessage(`❌ Error al cargar el jardín: ${error.message}`, 'error');
        
        // Intentar cargar desde localStorage como último recurso
        try {
            const savedProducts = localStorage.getItem('products');
            if (savedProducts) {
                products = JSON.parse(savedProducts);
                showMessage('⚠️ Cargando jardín desde respaldo local', 'warning');
            }
        } catch (localError) {
            products = [];
        }
    } finally {
        loadingDiv.style.display = 'none';
        renderProducts();
    }
}

// Función para inicializar la aplicación
async function initializeApp() {
    console.log('🚀 Inicializando aplicación...');
    
    // Intentar inicializar Firebase
    const firebaseReady = await initializeFirebase();
    
    // Cargar productos
    await loadProducts();
    
    // Si Firebase está disponible, configurar listener en tiempo real (opcional)
    if (firebaseReady) {
        setupRealtimeListener();
    }
    
    console.log('✅ Aplicación inicializada correctamente');
}

// Función para configurar listener en tiempo real (opcional)
function setupRealtimeListener() {
    if (!isFirebaseConfigured) return;
    
    let isInitialLoad = true;
    
    // Escuchar cambios en tiempo real
    db.collection('products').orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            // Ignorar la primera carga para evitar duplicados
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }
            
            const hasChanges = snapshot.docChanges().length > 0;
            if (hasChanges) {
                console.log('🔄 Detectados cambios en Firebase, actualizando...');
                products = [];
                snapshot.forEach(doc => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                renderProducts();
                
                // Actualizar localStorage
                try {
                    localStorage.setItem('products', JSON.stringify(products));
                } catch (error) {
                    console.warn('No se pudo actualizar localStorage');
                }
            }
        }, (error) => {
            console.error('Error en listener de Firebase:', error);
        });
}

// Event listeners
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (addBtn.disabled) return;

    const name = productNameInput.value.trim();
    if (!name) {
        showMessage('❌ Por favor, introduce tu nombre', 'error');
        return;
    }

    addBtn.disabled = true;
    addBtn.textContent = '⏳ Creando flor...';

    try {
        await addProduct(name);
        productNameInput.value = '';
    } catch (error) {
        console.error('Error en submit:', error);
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Crea tu flor';
    }
});

// Validación en tiempo real
productNameInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    addBtn.disabled = value.length === 0;
});

// Función para recargar datos manualmente
window.reloadGarden = async function() {
    await loadProducts(true);
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Manejar visibilidad de la página para recargar cuando el usuario vuelve
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isFirebaseConfigured) {
        console.log('👁️ Usuario regresó, verificando actualizaciones...');
        loadProducts();
    }
});