
import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';

const About: React.FC = () => {
  const whatsappUrl = "https://wa.me/5511988887777?text=Olá! Gostaria de saber mais sobre como tornar meu condomínio um parceiro da FacilitiesCON.";

  return (
    <div className="pt-20 bg-white selection:bg-brand-accent selection:text-brand-blue">
      {/* Hero Sobre */}
      <section className="py-32 lg:py-48 relative overflow-hidden" aria-labelledby="about-heading">
        <div className="container mx-auto px-6 text-center max-w-5xl relative z-10">
            <h1 id="about-heading" className="text-6xl lg:text-8xl font-black font-heading text-brand-blue mb-10 tracking-tighter leading-none">
              Inovação na <br/>
              <span className="gradient-text">Gestão Predial Moderna.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-medium">
              A <strong>FacilitiesCON</strong> surgiu para redefinir o mercado de manutenção condominial através da tecnologia e transparência absoluta em cada m² gerenciado.
            </p>
        </div>
      </section>

      {/* DNA Section */}
      <section className="py-32 bg-brand-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center relative z-10">
          {[
            { icon: Icons.Cpu, title: "Facilities Tech", desc: "Plataforma própria para gestão ágil de chamados técnicos." },
            { icon: Icons.Award, title: "Engenharia Civil", desc: "Técnicos certificados e supervisão de engenheiros experientes." },
            { icon: Icons.Target, title: "SLA Garantido", desc: "Foco total na redução do tempo de resposta operacional." },
            { icon: Icons.Smile, title: "Satisfação do Síndico", desc: "Redução comprovada de atritos e aumento da valorização predial." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-brand-accent border border-white/10 shadow-inner">
                <item.icon size={30} />
              </div>
              <h3 className="text-lg md:text-xl font-black">{item.title}</h3>
              <p className="text-gray-400 text-xs md:text-sm font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-24 md:py-40 bg-white">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
           <div className="w-full lg:w-1/2 relative">
              <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-premium">
                <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=2070&auto=format&fit=crop" className="w-full h-[400px] md:h-[600px] object-cover" alt="Engenheiro da FacilitiesCON realizando inspeção predial técnica" />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-accent rounded-[3rem] p-10 flex flex-col justify-center items-center text-brand-blue shadow-glow z-20">
                 <p className="text-5xl font-black">100%</p>
                 <p className="text-xs font-black uppercase tracking-widest mt-2">Segurança Jurídica</p>
              </div>
           </div>
           <div className="w-full lg:w-1/2 space-y-10">
              <h2 className="text-4xl md:text-5xl font-black font-heading text-brand-blue leading-tight italic">Por que escolher a FacilitiesCON para seu prédio?</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 text-brand-blue border border-slate-100"><Icons.Check size={24} /></div>
                  <div>
                    <h4 className="text-xl font-black mb-2 text-brand-blue">Gestão Transparente</h4>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Nossa gestão predial elimina surpresas no orçamento condominial. Aprovações digitais e laudos fotográficos garantem a conformidade total.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 text-brand-blue border border-slate-100"><Icons.Check size={24} /></div>
                  <div>
                    <h4 className="text-xl font-black mb-2 text-brand-blue">Especialistas Certificados</h4>
                    <p className="text-slate-500 font-medium text-sm md:text-base">De elétrica a hidráulica e civil, todos os nossos técnicos são homologados e treinados para o padrão FacilitiesCON de qualidade.</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default About;
