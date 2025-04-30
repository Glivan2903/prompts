import React from 'react';
import { Link } from 'react-router-dom';
import GuideSection from '@/components/GuideSection';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const GuidePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manual do Usuário</h1>
        <Link to="/builder">
          <Button className="flex items-center gap-2 h-12 bg-gradient-to-r from-[#61CE70] to-[#58FF0F] hover:from-[#58FF0F] hover:to-[#61CE70] text-white transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
            Ir para o Builder <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
      
      <GuideSection />
    </div>
  );
};

export default GuidePage;
