import { initializeApp } from 'firebase/app';
import { doc, getFirestore, Timestamp, updateDoc } from 'firebase/firestore';

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

async function fixProductStructure() {
  try {
    const productId = '6eJAVZyPNESip6ChVJCV';
    const productRef = doc(db, 'products', productId);
    
    console.log('🔧 Actualizando producto con estructura correcta...\n');
    
    await updateDoc(productRef, {
      // Cambiar name a title multilingüe
      title: {
        es: 'Collar de Plata Luna',
        en: 'Silver Moon Necklace'
      },
      // Cambiar description a multilingüe
      description: {
        es: 'Hermoso collar artesanal de plata con diseño de luna creciente. Perfecto para uso diario.',
        en: 'Beautiful handmade silver necklace with crescent moon design. Perfect for everyday wear.'
      },
      // Cambiar imageUrl a images (array)
      images: [
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800'
      ],
      updatedAt: Timestamp.now(),
      // Eliminar campos antiguos
      name: null,
      imageUrl: null,
      stock: null
    });
    
    console.log('✅ Producto actualizado exitosamente!');
    console.log('📦 ID:', productId);
    console.log('\n🌐 Ahora visita http://localhost:4322/catalog para verlo');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar el producto:', error);
    process.exit(1);
  }
}

fixProductStructure();
