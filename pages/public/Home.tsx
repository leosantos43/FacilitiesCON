
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { db } from '../../services/mockSupabase';
import { Service, Condominium, Testimonial } from '../../types';

const Home: React.FC = () => {
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [servicesFromDb, setServicesFromDb] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const [condosData, servs, tests] = await Promise.all([
          db.getCondominiums(),
          db.getServices(),
          db.getTestimonials(true)
        ]);
        setCondos(condosData);
        setServicesFromDb(servs);
        setTestimonials(tests);
      } catch (e) {
        console.error("Erro ao carregar conteúdo da home", e);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  return (
    <div className="overflow-x-hidden bg-white selection:bg-brand-accent selection:text-brand-blue">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-brand-dark overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <img 
             src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
             className="w-full h-full object-cover opacity-10 grayscale scale-110"
             alt="JLM Facilities"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/95 via-brand-dark/80 to-brand-dark"></div>
          <div className="absolute inset-0 noise-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 text-center space-y-12 animate-slide-up">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[11px] font-black uppercase tracking-[0.4em] backdrop-blur-xl mx-auto">
            <Icons.Zap size={14} /> JLM Facilities & Engenharia
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl xl:text-9xl font-black font-heading leading-[0.9] tracking-tighter text-white">
            Gestão que <br className="hidden md:block" />
            <span className="gradient-text italic">valoriza</span> o <br className="hidden md:block" />
            seu <span className="text-white">patrimônio.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-4xl mx-auto leading-relaxed font-medium px-4">
            A união entre manutenção preventiva de alto nível e transparência digital absoluta. A JLM é a parceira estratégica do síndico moderno.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 px-4">
            <Link to="/login" className="group bg-brand-accent hover:bg-white text-brand-blue text-base md:text-lg font-black py-6 px-14 rounded-2xl shadow-glow hover:scale-105 transition-all flex items-center justify-center gap-4">
              Portal do Morador <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/staff" className="bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 text-white text-base md:text-lg font-black py-6 px-14 rounded-2xl transition flex items-center justify-center gap-4">
              Acesso Gestão <Icons.Shield size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Condomínios Parceiros */}
      <section className="py-24 bg-brand-dark border-t border-white/5 overflow-hidden">
        <div className="container mx-auto px-6">
           <h2 className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-16 italic">Condomínios Atendidos & Parceiros Ativos</h2>
           
           <div className="flex animate-marquee gap-24 items-center whitespace-nowrap opacity-40 hover:opacity-100 transition-all duration-700 cursor-default">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-24 items-center">
                  {condos.length > 0 ? condos.map((c, idx) => (
                    <span key={idx} className="text-2xl md:text-4xl font-black text-white font-heading tracking-tighter hover:text-brand-accent transition-colors">{c.name}</span>
                  )) : (
                    ['Torre Imperial', 'Residencial Diamond', 'Solar do Parque', 'Edifício Alpha', 'Condomínio Horizonte'].map((n, idx) => (
                      <span key={idx} className="text-2xl md:text-4xl font-black text-white font-heading tracking-tighter">{n}</span>
                    ))
                  )}
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Nossas Verticais Dinâmicas (Bento Grid) */}
      <section className="py-32 bg-slate-50 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-24">
             <h2 className="text-[11px] font-black text-brand-accent uppercase tracking-[0.5em] mb-4">Portfólio de Serviços</h2>
             <h3 className="text-4xl md:text-7xl font-black text-brand-blue font-heading tracking-tighter leading-none italic">Nossas Verticais <br/>Especialistas.</h3>
             <p className="mt-8 text-slate-500 font-medium text-lg leading-relaxed">
               Cada serviço é executado por técnicos homologados, seguindo rigorosos protocolos de segurança e qualidade certificados pela JLM Facilities.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] md:auto-rows-[350px]">
            {servicesFromDb.length > 0 ? (
              servicesFromDb.map((service, index) => {
                const isLarge = index === 0;
                const isMedium = index === 1 || index === 2;
                const IconComp = (Icons as any)[service.icon] || Icons.Wrench;

                return (
                  <div 
                    key={service.id}
                    className={`${
                      isLarge ? 'md:col-span-8 md:row-span-1 bg-brand-blue text-white' : 
                      isMedium ? 'md:col-span-6 bg-white border border-slate-200 text-brand-blue' :
                      'md:col-span-4 bg-white border border-slate-200 text-brand-blue'
                    } rounded-[3.5rem] p-10 md:p-14 flex flex-col justify-end relative overflow-hidden group hover:shadow-premium transition-all`}
                  >
                     <div className="relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isLarge ? 'bg-brand-accent text-brand-blue' : 'bg-slate-50 text-brand-blue group-hover:bg-brand-accent transition-all'}`}>
                           <IconComp size={32} />
                        </div>
                        <h4 className="text-2xl md:text-3xl font-black mb-4 tracking-tighter">{service.title}</h4>
                        <p className={`font-medium text-sm leading-relaxed ${isLarge ? 'text-slate-300 max-w-xl' : 'text-slate-500'}`}>
                          {service.description}
                        </p>
                     </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.5em] italic">Carregando catálogo técnico...</div>
            )}
          </div>
        </div>
      </section>

      {/* Laudo Digital */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
             <div className="w-full lg:w-1/2 space-y-10">
                <div className="space-y-4">
                   <h2 className="text-[11px] font-black text-brand-accent uppercase tracking-[0.5em]">Transparência Total</h2>
                   <h3 className="text-4xl md:text-6xl font-black text-brand-blue font-heading tracking-tighter leading-none">O Laudo Técnico <br/>no seu celular.</h3>
                </div>
                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                  Esqueça as planilhas confusas. Na JLM, cada atendimento gera um laudo fotográfico detalhado com geolocalização e assinatura técnica do engenheiro.
                </p>
                <div className="grid grid-cols-2 gap-8">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <Icons.Camera className="text-brand-accent mb-4" size={32} />
                      <h5 className="font-black text-brand-blue mb-2">Evidência Real</h5>
                      <p className="text-xs text-slate-400 font-medium">Fotos do 'Antes' e 'Depois' em cada etapa do reparo.</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                      <Icons.FileText className="text-brand-accent mb-4" size={32} />
                      <h5 className="font-black text-brand-blue mb-2">Garantia Certificada</h5>
                      <p className="text-xs text-slate-400 font-medium">Validação técnica digital para prestação de contas.</p>
                   </div>
                </div>
             </div>
             
             <div className="w-full lg:w-1/2 relative">
                <div className="relative z-10 bg-brand-blue p-4 rounded-[4rem] shadow-premium max-w-sm mx-auto overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-700">
                   <div className="bg-white rounded-[3rem] p-8 aspect-[9/16] flex flex-col">
                      <div className="flex justify-between items-center mb-10">
                         <div className="w-8 h-8 bg-brand-accent rounded-xl flex items-center justify-center text-brand-blue"><Icons.Building size={16} /></div>
                         <span className="text-[9px] font-black uppercase text-slate-400">Laudo Digital</span>
                      </div>
                      <div className="flex-1 space-y-6">
                         <div className="h-40 bg-slate-100 rounded-[2rem] overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=400" className="w-full h-full object-cover" />
                         </div>
                         <div className="space-y-3">
                            <div className="h-3 w-3/4 bg-slate-100 rounded-full"></div>
                            <div className="h-3 w-full bg-slate-100 rounded-full"></div>
                            <div className="h-3 w-1/2 bg-slate-100 rounded-full"></div>
                         </div>
                      </div>
                      <div className="mt-auto p-4 bg-brand-green/10 border border-brand-green/20 rounded-2xl flex items-center gap-3">
                         <Icons.ShieldCheck className="text-brand-green" size={24} />
                         <span className="text-[10px] font-black text-brand-green uppercase">Concluído & Homologado</span>
                      </div>
                   </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-brand-accent/10 rounded-full blur-[120px] -z-10"></div>
             </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative bg-brand-blue overflow-hidden">
        <div className="absolute inset-0 noise-overlay opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
           <h2 className="text-5xl md:text-8xl font-black font-heading text-white tracking-tighter leading-none">
              Pronto para elevar o <br className="hidden md:block"/> 
              padrão do seu prédio?
           </h2>
           <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto font-medium">
              Agende agora uma auditoria técnica gratuita no seu condomínio.
           </p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href="https://wa.me/5511988887777" target="_blank" className="bg-white text-brand-blue px-14 py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-premium hover:scale-105 transition-all">Solicitar Visita Técnica</a>
              <Link to="/register" className="bg-brand-accent text-brand-blue px-14 py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-glow hover:bg-white transition-all">Cadastrar Unidade</Link>
           </div>
        </div>
      </section>

      <footer className="bg-brand-dark py-24 border-t border-white/5">
        <div className="container mx-auto px-6 text-center space-y-12">
           <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-brand-blue"><Icons.Building size={20} /></div>
              <span className="text-2xl font-black text-white font-heading tracking-tighter">JLM <span className="text-brand-accent">Facilities</span></span>
           </div>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">© {new Date().getFullYear()} JLM Facilities • Gestão & Engenharia</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
