'use client';

import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { toast } from './ui/use-toast';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { ProductCatalogPDF } from './ProductCatalogPDF';

interface Product {
  name?: string;
  sku?: string;
  salesPrice?: number;
  productdescription?: string;
  img?: string;
  image1?: string;
  image2?: string;
  gsm?: string | number;
  oz?: string | number;
  cm?: string | number;
  inch?: string | number;
}

interface CatalogButtonProps {
  product: Product;
  className?: string;
}

export function CatalogButton({ product, className = '' }: CatalogButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Show loading toast
      toast({
        title: 'Generating catalog...',
        description: 'Please wait while we prepare your download.',
      });
      
      // Generate PDF on client side with the product data
      const blob = await pdf(ProductCatalogPDF({ product })).toBlob();
      
      // Save the file
      saveAs(blob, `catalog-${product.sku || 'product'}.pdf`);
      
      // Show success toast
      toast({
        title: 'Download started!',
        description: 'Your catalog is being downloaded.',
        variant: 'default',
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate catalog. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      aria-label="Download product catalog"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Free Catalog
        </>
      )}
    </button>
  );
}
