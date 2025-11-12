import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { Category } from '@/app/types/category';
import CategoriesList from '@/app/components/Categories/CategoriesList';
import { Card, CardContent } from '@/app/components/ui/card';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up Firestore query');
    
    const q = query(
      collection(db, 'categories'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log('Raw Firestore data:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const categoriesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            isActive: Boolean(data.isActive),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }) as Category[];
        
        console.log('Processed categories data:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error processing categories:', error);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('Error fetching categories:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  console.log('Rendering page with categories:', categories);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardContent className="p-6">
          <CategoriesList 
            categories={categories}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}