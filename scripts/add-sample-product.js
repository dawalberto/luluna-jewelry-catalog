import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDzl2xnBdxf7BArz1Kx9n44vp0AVjXFk2I",
  authDomain: "luluna-4c312.firebaseapp.com",
  projectId: "luluna-4c312",
  storageBucket: "luluna-4c312.firebasestorage.app",
  messagingSenderId: "1023962911630",
  appId: "1:1023962911630:web:d16f50b059769bf5750adf",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addSampleProduct() {
  try {
    const product = {
      title: {
        es: 'Collar de Plata Luna',
        en: 'Silver Moon Necklace'
      },
      description: {
        es: 'Hermoso collar artesanal de plata con diseño de luna creciente. Perfecto para uso diario.',
        en: 'Beautiful handmade silver necklace with crescent moon design. Perfect for everyday wear.'
      },
      price: 45.99,
      category: 'necklaces',
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'
      ],
      published: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'products'), product);
    console.log('✅ Producto creado exitosamente con ID:', docRef.id);
    console.log('📦 Producto:', product.title.es);
    console.log('💰 Precio:', product.price);
    console.log('📂 Categoría:', product.category);
    console.log('\n🌐 Visita http://localhost:4322/catalog para verlo');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear el producto:', error);
    process.exit(1);
  }
}

addSampleProduct();
