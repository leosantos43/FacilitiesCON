
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

  const whatsappUrl = "https://wa.me/5511988887777?text=Olá! Sou síndico e gostaria de uma consultoria sobre gestão predial.";

  return (
    <main className="overflow-x-hidden bg-white selection:bg-brand-accent selection:text-brand-blue">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-brand-dark overflow-hidden px-4" aria-labelledby="main-heading">
        <div className="absolute inset-0 z-0">
          <img 
             src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
             className="w-full h-full object-cover opacity-10 grayscale scale-110"
             alt="Fachada moderna representando Gestão Predial Inteligente FacilitiesCON"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/95 via-brand-dark/80 to-brand-dark"></div>
          <div className="absolute inset-0 noise-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 text-center space-y-12 animate-slide-up">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[11px] font-black uppercase tracking-[0.4em] backdrop-blur-xl mx-auto">
            <Icons.Zap size={14} /> Especialista em Facilities e Engenharia
          </div>
          
          <h1 id="main-heading" className="text-6xl sm:text-7xl md:text-8xl xl:text-9xl font-black font-heading leading-[0.9] tracking-tighter text-white">
            Gestão Predial que <br className="hidden md:block" />
            <span className="gradient-text italic">valoriza</span> o <br className="hidden md:block" />
            seu <span className="text-white">patrimônio.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 max-w-4xl mx-auto leading-relaxed font-medium px-4">
            A união entre <strong>manutenção preventiva</strong> de alto nível e tecnologia para condomínios. A FacilitiesCON é líder em <strong>Gestão de Facilities</strong> e Engenharia em São Paulo.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 px-4">
            <Link to="/login" className="group bg-brand-accent hover:bg-white text-brand-blue text-base md:text-lg font-black py-6 px-14 rounded-2xl shadow-glow hover:scale-105 transition-all flex items-center justify-center gap-4">
              Acesso Morador <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/staff" className="bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 text-white text-base md:text-lg font-black py-6 px-14 rounded-2xl transition flex items-center justify-center gap-4">
              Portal do Gestor <Icons.Shield size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Condomínios Parceiros */}
      <section className="py-24 bg-brand-dark border-t border-white/5 overflow-hidden" aria-label="Clientes e Parceiros em Gestão de Facilities">
        <div className="container mx-auto px-6">
           <h2 className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-16 italic">Autoridade em Manutenção de Fachadas e Engenharia Civil</h2>
           
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

      {/* Serviços Otimizados */}
      <section className="py-32 bg-slate-50 relative" aria-labelledby="services-heading">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-24">
             <h2 id="services-heading" className="text-[11px] font-black text-brand-accent uppercase tracking-[0.5em] mb-4">Soluções Completas em Facilities</h2>
             <h3 className="text-4xl md:text-7xl font-black text-brand-blue font-heading tracking-tighter leading-none italic">Engenharia e Gestão Predial de Alta Performance.</h3>
             <p className="mt-8 text-slate-500 font-medium text-lg leading-relaxed">
               Nossa <strong>gestão condominial técnica</strong> foca em segurança operacional, redução de custos com energia e água, e <strong>manutenção corretiva</strong> ágil.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px] md:auto-rows-[350px]">
            {servicesFromDb.length > 0 ? (
              servicesFromDb.map((service, index) => {
                const isLarge = index === 0;
                const isMedium = index === 1 || index === 2;
                const IconComp = (Icons as any)[service.icon] || Icons.Wrench;

                return (
                  <article 
                    key={service.id}
                    className={`${
                      isLarge ? 'md:col-span-8 md:row-span-1 bg-brand-blue text-white' : 
                      isMedium ? 'md:col-span-6 bg-white border border-slate-200 text-brand-blue' :
                      'md:col-span-4 bg-white border border-slate-200 text-brand-blue'
                    } rounded-[3.5rem] p-10 md:p-14 flex flex-col justify-end relative overflow-hidden group hover:shadow-premium transition-all`}
                  >
                     <div className="relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isLarge ? 'bg-brand-accent text-brand-blue' : 'bg-slate-50 text-brand-blue group-hover:bg-brand-accent transition-all'}`}>
                           <IconComp size={32} aria-hidden="true" />
                        </div>
                        <h4 className="text-2xl md:text-3xl font-black mb-4 tracking-tighter">{service.title}</h4>
                        <p className={`font-medium text-sm leading-relaxed ${isLarge ? 'text-slate-300 max-w-xl' : 'text-slate-500'}`}>
                          {service.description}
                        </p>
                     </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-[0.5em] italic">Carregando catálogo de gestão predial...</div>
            )}
          </div>
        </div>
      </section>

      {/* Propaganda Exclusiva para Síndicos */}
      <section className="py-32 bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px]"></div>
        <div className="container mx-auto px-6 relative z-10">
           <div className="bg-brand-blue/50 border border-white/5 rounded-[4rem] p-8 md:p-20 backdrop-blur-2xl">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                 <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                    <h2 className="text-brand-accent text-[11px] font-black uppercase tracking-[0.5em]">Exclusivo para Síndicos</h2>
                    <h3 className="text-4xl md:text-6xl font-black text-white font-heading tracking-tighter leading-none italic uppercase">Profissionalize sua Gestão sem Aumento de Taxa.</h3>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed">
                       Cansado de cobrar relatórios e lidar com amadorismo? A <strong>FacilitiesCON</strong> entrega o que há de mais moderno em <strong>engenharia condominial</strong> com transparência digital para você e seu conselho.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                       <a href={whatsappUrl} target="_blank" className="bg-brand-accent text-brand-blue px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow hover:bg-white transition-all flex items-center justify-center gap-3">
                          <Icons.MessageCircle size={18} /> Consultoria Técnica Grátis
                       </a>
                       <Link to="/about" className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                          Conhecer Diferenciais
                       </Link>
                    </div>
                 </div>
                 <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { t: "Blindagem Jurídica", d: "ART de engenheiro responsável em todos os serviços.", i: Icons.ShieldCheck },
                      { t: "Redução de Custos", d: "Manutenção preventiva que evita gastos emergenciais.", i: Icons.TrendingDown },
                      { t: "Portal de Evidências", d: "Fotos e laudos prontos para prestação de contas.", i: Icons.FileText },
                      { t: "SLA de 4 Horas", d: "Pronto atendimento para chamados críticos.", i: Icons.Clock }
                    ].map((card, i) => (
                      <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-brand-accent/10 transition-colors group">
                         <card.i className="text-brand-accent mb-4 group-hover:scale-110 transition-transform" size={24} />
                         <h4 className="text-white font-black text-sm mb-2 uppercase tracking-wider">{card.t}</h4>
                         <p className="text-slate-500 text-xs font-medium leading-relaxed">{card.d}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative bg-brand-blue overflow-hidden" aria-labelledby="cta-title">
        <div className="absolute inset-0 noise-overlay opacity-10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
           <h2 id="cta-title" className="text-5xl md:text-8xl font-black font-heading text-white tracking-tighter leading-none">
              Pronto para elevar o <br className="hidden md:block"/> 
              padrão do seu prédio?
           </h2>
           <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto font-medium">
              A <strong>FacilitiesCON</strong> é especialista em transformar a manutenção predial em valorização patrimonial real. Agende uma consultoria técnica.
           </p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a href={whatsappUrl} target="_blank" rel="noopener" className="bg-white text-brand-blue px-14 py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-premium hover:scale-105 transition-all">Solicitar Auditoria Técnica</a>
              <a href={whatsappUrl} target="_blank" rel="noopener" className="bg-brand-accent text-brand-blue px-14 py-6 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-glow hover:bg-white transition-all">Consultoria Facilities</a>
           </div>
        </div>
      </section>

      <footer className="bg-brand-dark py-24 border-t border-white/5">
        <div className="container mx-auto px-6 text-center space-y-12">
           <div className="flex items-center justify-center gap-4">
              <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center text-brand-blue"><Icons.Building size={20} /></div>
              <span className="text-2xl font-black text-white font-heading tracking-tighter">Facilities<span className="text-brand-accent">CON</span></span>
           </div>
           <div className="max-w-md mx-auto">
              <p className="text-slate-400 text-sm font-medium">Líder em Gestão Predial em São Paulo e Região Metropolitana. Engenharia Condominial e Manutenção de Facilities.</p>
           </div>
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">© {new Date().getFullYear()} FacilitiesCON • Todos os direitos reservados</p>
        </div>
      </footer>
    </main>
  );
};

export default Home;
