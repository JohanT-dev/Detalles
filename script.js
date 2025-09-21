//Configuración de Firebase (REEMPLAZA CON TUS CREDENCIALES)
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


// Función para crear una tarjeta de producto
function createProductCard(product) {
    return `
                <div class="product-card" data-id="${product.id}">
<div class="container">
  <!-- Plant pot -->
  <div class="pot pot-bot">
    <div class="shadow"></div>
    <div class="pot pot-shadow"></div>
    <div class="pot pot-top"></div>
    
    <!-- Plant -->
    <div class="plant">
      <div class="head">
      <!--div class="face"></div-->
      <ul>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
       </div>
    </div>
    
  </div>
</div>
                </div>
            `;
}

// Función para renderizar productos
function renderProducts() {
    if (products.length === 0) {
        productsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7); padding: 40px;">
                        <div style="font-size: 4em; margin-bottom: 20px;">📦</div>
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
        name: name.trim(),

    };

    if (isFirebaseConfigured) {
        try {
            await db.collection('products').doc(newProduct.id).set(newProduct);
            products.push(newProduct);
            showMessage(`✅ Producto "${name}" añadido correctamente`);
        } catch (error) {
            console.error('Error añadiendo producto:', error);
            showMessage(`❌ Error al añadir producto: ${error.message}`, 'error');
            return;
        }
    } else {
        // Almacenamiento local como fallback
        products.push(newProduct);
        localStorage.setItem('products', JSON.stringify(products));
        showMessage(`✅ Producto "${name}" añadido localmente`);
    }

    renderProducts();
}

// Función para eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }

    if (isFirebaseConfigured) {
        try {
            await db.collection('products').doc(productId).delete();
            products = products.filter(p => p.id !== productId);
            showMessage('✅ Producto eliminado correctamente');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showMessage(`❌ Error al eliminar producto: ${error.message}`, 'error');
            return;
        }
    } else {
        // Almacenamiento local como fallback
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        showMessage('✅ Producto eliminado localmente');
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
        const stored = localStorage.getItem('products');
        products = stored ? JSON.parse(stored) : [];
        if (!stored) {
            showMessage('⚠️ Usando almacenamiento local (Firebase no configurado)', 'error');
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
            { id: 'demo1', name: 'Camiseta Básica', icon: '👕', createdAt: new Date().toISOString() },
            { id: 'demo2', name: 'Pantalón Vaquero', icon: '👖', createdAt: new Date().toISOString() },
            { id: 'demo3', name: 'Zapatillas Deportivas', icon: '👟', createdAt: new Date().toISOString() }
        ];
        products = exampleProducts;
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();
    }
}, 1000);