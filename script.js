// Configuración de Firebase (REEMPLAZA CON TUS CREDENCIALES)
const firebaseConfig = {
    apiKey: "AIzaSyDjElCiSGJNkMMhlDruX6N9FiTYUay0hr0",
    authDomain: "fir-proyect-johan.firebaseapp.com",
    projectId: "fir-proyect-johan",
    storageBucket: "fir-proyect-johan.firebasestorage.app",
    messagingSenderId: "1088410162010",
    appId: "1:1088410162010:web:5284e59b95fc1710bc1963",
    measurementId: "G-K4FTJDRMJB"
};

// Inicializar Firebase
let db;
let isFirebaseConfigured = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseConfigured = true;
} catch (error) {
    console.warn('Firebase no configurado correctamente, usando almacenamiento local');
    isFirebaseConfigured = false;
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
<div id="position" class="sunflower">
	<div class="head">
	    <div id="eye-1" class="eye"></div>
	    <div id="eye-2" class="eye"></div>
	    <div class="mouth"></div>
	</div>
	<div class="petals"></div>
	<div class="trunk">
		<div class="left-branch"></div>
		<div class="right-branch"></div>
	</div>
	<div class="vase"></div>
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
                        <h3>No hay productos aún</h3>
                        <p>¡Añade tu primer producto usando el formulario de arriba!</p>
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
            showMessage(` Felicidades "${name}" tu flor se ha añadido al jardín`);
        } catch (error) {
            console.error('Error añadiendo producto:', error);
            showMessage(`Lo siento parace que tengo este problema ${error.message}`, 'no puedo agregar tu flor');
            return;
        }
    } else {
        // Almacenamiento local como fallback
        products.push(newProduct);
        try {
            localStorage.setItem('products', JSON.stringify(products));
            showMessage(`Felicidades "${name}" tu flor se ha añadido al jardín`);
        } catch (error) {
            showMessage(`Lo siento parace que tengo este problema ${error.message}`, 'no puedo agregar tu flor');
        }
    }

    renderProducts();
}

// Función para cargar productos
async function loadProducts() {
    loadingDiv.style.display = 'block';

    if (isFirebaseConfigured) {
        try {
            const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error('Error cargando productos:', error);
            showMessage(`❌ Error al cargar productos: ${error.message}`, 'error');
        }
    } else {
        // Cargar desde localStorage como fallback
        try {
            const stored = localStorage.getItem('products');
            products = stored ? JSON.parse(stored) : [];
            if (!stored) {
                showMessage('⚠️ Usando almacenamiento local (Firebase no configurado)', 'error');
            }
        } catch (error) {
            products = [];
            showMessage('⚠️ Error al cargar datos locales', 'error');
        }
    }

    loadingDiv.style.display = 'none';
    renderProducts();
}

// Event listeners
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = productNameInput.value.trim();
    if (!name) {
        showMessage('❌ Por favor, introduce un nombre para el producto', 'error');
        return;
    }

    addBtn.disabled = true;
    addBtn.textContent = '⏳ Añadiendo...';

    await addProduct(name);

    productNameInput.value = '';
    addBtn.disabled = false;
    addBtn.textContent = '➕ Añadir Producto';
});

// Validación en tiempo real
productNameInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    addBtn.disabled = value.length === 0;
});

// Hacer deleteProduct global
window.deleteProduct = deleteProduct;

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// Añadir algunos productos de ejemplo si no hay ninguno (solo para demostración)
setTimeout(() => {
    if (products.length === 0 && !isFirebaseConfigured) {
        const exampleProducts = [
            { id: 'demo1', name: 'Camiseta Básica', createdAt: new Date().toISOString() },
            { id: 'demo2', name: 'Pantalón Vaquero', createdAt: new Date().toISOString() },
            { id: 'demo3', name: 'Zapatillas Deportivas', createdAt: new Date().toISOString() }
        ];
        products = exampleProducts;
        try {
            localStorage.setItem('products', JSON.stringify(products));
        } catch (error) {
            console.warn('No se pudo guardar en localStorage');
        }
        renderProducts();
    }
}, 1000);