import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockSupabase';
import { Testimonial, TestimonialStatus } from '../../types';
import { Icons } from '../../components/Icons';

const AdminTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.getTestimonials(false);
    setTestimonials(data);
  };

  const handleStatusChange = async (id: string, status: TestimonialStatus) => {
    await db.updateTestimonialStatus(id, status);
    loadData();
  };

  const displayed = testimonials.filter(t => 
    activeTab === 'pending' ? t.status === TestimonialStatus.PENDING : t.status === TestimonialStatus.APPROVED
  );

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading text-jlm-dark mb-6">Gerenciar Depoimentos</h1>
      
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'pending' ? 'border-b-2 border-jlm-blue text-jlm-blue' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendentes ({testimonials.filter(t => t.status === TestimonialStatus.PENDING).length})
        </button>
        <button 
          className={`pb-2 px-4 font-medium ${activeTab === 'approved' ? 'border-b-2 border-jlm-blue text-jlm-blue' : 'text-gray-500'}`}
          onClick={() => setActiveTab('approved')}
        >
          Publicados ({testimonials.filter(t => t.status === TestimonialStatus.APPROVED).length})
        </button>
      </div>

      <div className="space-y-4">
        {displayed.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum depoimento nesta categoria.</p>
        ) : displayed.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-800">{t.author_name}</span>
                <span className="text-sm text-gray-500">• {t.condo_name}</span>
                <div className="flex text-yellow-400 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <Icons.Star key={i} size={14} fill={i < t.rating ? "currentColor" : "none"} />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg italic border border-gray-100">"{t.message}"</p>
              <p className="text-xs text-gray-400 mt-2">Enviado em: {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="flex gap-2">
              {activeTab === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleStatusChange(t.id, TestimonialStatus.APPROVED)}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition"
                  >
                    <Icons.CheckCircle size={16} /> Aprovar
                  </button>
                  <button 
                    onClick={() => handleStatusChange(t.id, TestimonialStatus.REJECTED)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition"
                  >
                    <Icons.X size={16} /> Rejeitar
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleStatusChange(t.id, TestimonialStatus.PENDING)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
                >
                  Ocultar / Revisar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTestimonials;