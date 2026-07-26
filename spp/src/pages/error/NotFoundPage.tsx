import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-emerald-primary/20 mb-2 font-heading select-none">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-obsidian mb-2 font-heading">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-slate mb-8">
          Sepertinya halaman yang Anda cari sudah dipindahkan atau tidak tersedia.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
          >
            Kembali
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => navigate('/login')}
          >
            ke Halaman Login
          </Button>
        </div>
      </div>
    </div>
  );
};
