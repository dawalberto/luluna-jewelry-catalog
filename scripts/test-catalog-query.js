import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

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

async function testCatalogQuery() {
  try {
    console.log('🔍 Testing catalog query (same as CatalogView)...\n');
    
    // Esta es la misma query que usa el catálogo (sin orderBy temporalmente)
    const catalogQuery = query(
      collection(db, 'products'),
      where('published', '==', true)
      // orderBy('createdAt', 'desc') // Comentado mientras se crea el índice
    );
    
    console.log('📦 Query: published == true (sin orderBy)');
    const snapshot = await getDocs(catalogQuery);
    console.log(`   Total resultados: ${snapshot.size}\n`);
    
    if (snapshot.size === 0) {
      console.log('❌ No se encontraron productos!');
      console.log('   Posibles causas:');
      console.log('   1. El campo "published" no es exactamente true (boolean)');
      console.log('   2. No existe el campo "createdAt"');
      console.log('   3. Las reglas de Firestore bloquean la lectura\n');
    } else {
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`✅ ID: ${doc.id}`);
        console.log(`   published: ${data.published} (type: ${typeof data.published})`);
        console.log(`   title.es: ${data.title?.es || 'MISSING'}`);
        console.log(`   createdAt: ${data.createdAt ? 'EXISTS' : 'MISSING'}`);
        console.log('   ---\n');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.message.includes('index')) {
      console.log('\n⚠️  Necesitas crear un índice en Firestore!');
      console.log('   Firebase te mostrará un link en la consola.');
    }
    process.exit(1);
  }
}

testCatalogQuery();
