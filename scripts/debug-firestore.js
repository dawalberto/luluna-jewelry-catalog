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

async function debugFirestore() {
  try {
    console.log('🔍 Conectando a Firebase...\n');
    
    // 1. Obtener todos los documentos sin filtros
    console.log('📦 Todos los documentos en "products":');
    const allDocsSnapshot = await getDocs(collection(db, 'products'));
    console.log(`   Total documentos: ${allDocsSnapshot.size}\n`);
    
    allDocsSnapshot.forEach((doc) => {
      console.log(`   ID: ${doc.id}`);
      console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
      console.log('   ---\n');
    });
    
    // 2. Obtener solo publicados
    console.log('✅ Documentos publicados (published == true):');
    const publishedQuery = query(
      collection(db, 'products'),
      where('published', '==', true)
    );
    const publishedSnapshot = await getDocs(publishedQuery);
    console.log(`   Total publicados: ${publishedSnapshot.size}\n`);
    
    publishedSnapshot.forEach((doc) => {
      console.log(`   ID: ${doc.id}`);
      console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
      console.log('   ---\n');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugFirestore();
