
import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';

const HowItWorks: React.FC = () => {
  const steps = [
    { 
      icon: Icons.Smartphone, 
      title: "Solicitação Ágil", 
      desc: "O morador ou síndico abre o chamado direto no navegador. Fotos e descrição detalhada garantem que o técnico já saiba o que fazer antes de chegar.",
      num: "01"
    },
    { 
      icon: Icons.Cpu, 
      title: "Triagem Inteligente", 
      desc: "Nossa central técnica avalia a complexidade do reparo e designa o especialista certificado para a vertical exata (Elétrica, Hidráulica, etc).",
      num: "02" 
    },
    { 
      icon: Icons.Calendar, 
      title: "Visita & Identificação", 
      desc: "Agendamento preciso com confirmação via portal. O cliente recebe a foto e o perfil do profissional que realizará o atendimento.",
      num: "03"
    },
    { 
      icon: Icons.ShieldCheck, 
      title: "Execução & Garantia", 
      desc: "O serviço é realizado e documentado digitalmente. A garantia técnica FacilitiesCON é ativada automaticamente após a emissão do laudo.",
      num: "04"
    }
  ];

  const valueProps = [
    { t: "Laudo Fotográfico", d: "Documentação completa de antes e depois.", i: Icons.Camera },
    { t: "Certificação NR", d: "Equipes treinadas em NR-10, NR-35 e normas ABNT.", i: Icons.Shield },
    { t: "Previsibilidade", d: "Orçamentos claros e sem custos surpresas.", i: Icons.TrendingUp },
    { t: "SLA Garantido", d: "Atendimento emergencial em até 4 horas.", i: Icons.Clock }
  ];

  return (
    <div className="bg-white selection:bg-brand-accent selection:text-brand-blue">
      {/* Hero Processo */}
      <section className="bg-brand-dark text-white py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue opacity-20"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-accent rounded-full blur-[150px] opacity-10"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
           <h1 className="text-5xl md:text-8xl font-black font-heading mb-8 leading-none tracking-tighter italic">
             O Método <span className="text-brand-accent">FacilitiesCON</span>.
           </h1>
           <p className="text-xl text-slate-400 leading-relaxed mb-12 font-medium">
             Transformamos a manutenção predial em uma experiência digital, transparente e resolutiva. Conheça as fases da nossa inteligência operacional de ponta a ponta.
           </p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <Link to="/login" className="bg-brand-accent text-brand-blue font-black py-5 px-12 rounded-2xl shadow-glow hover:scale-105 transition-all uppercase text-xs tracking-widest">
               Ver Portal na Prática
             </Link>
             <a href="#fluxo" className="bg-white/5 border border-white/10 text-white font-black py-5 px-12 rounded-2xl hover:bg-white/10 transition-all uppercase text-xs tracking-widest">
               Explorar Fluxograma
             </a>
           </div>
        </div>
      </section>

      {/* Visual Step Timeline */}
      <section id="fluxo" className="py-40 bg-white">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
             <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
             
             {steps.map((step, idx) => (
               <div key={idx} className="relative z-10 group">
                  <div className="mb-10 flex items-center justify-between lg:block">
                    <span className="text-7xl font-black text-slate-100 group-hover:text-brand-accent/20 transition-colors duration-500 leading-none">{step.num}</span>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-premium flex items-center justify-center text-brand-blue border border-slate-100 lg:mt-[-40px] group-hover:bg-brand-blue group-hover:text-white transition-all duration-500">
                      <step.icon size={36} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-brand-blue mb-4 tracking-tighter">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">{step.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Engenharia de Dados */}
      <section className="py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 noise-overlay opacity-10"></div>
        <div className="container mx-auto px-6">
           <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="w-full lg:w-1/2 space-y-10">
                 <h2 className="text-4xl md:text-7xl font-black font-heading tracking-tighter leading-none italic">
                   Engenharia baseada <br/>em <span className="text-brand-accent">dados reais.</span>
                 </h2>
                 <p className="text-lg text-slate-400 font-medium leading-relaxed">
                   Nossa plataforma não é apenas um portal de chamados. É um ecossistema de dados que permite ao síndico analisar tendências de manutenção, prever falhas e otimizar o orçamento condominial com precisão matemática.
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                       <Icons.TrendingUp className="text-brand-accent mb-4" />
                       <h4 className="font-black text-sm mb-1 uppercase tracking-widest">Analytics</h4>
                       <p className="text-xs text-slate-500">Gráficos de custos por vertical.</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                       <Icons.History className="text-brand-accent mb-4" />
                       <h4 className="font-black text-sm mb-1 uppercase tracking-widest">Rastreabilidade</h4>
                       <p className="text-xs text-slate-500">Histórico eterno da edificação.</p>
                    </div>
                 </div>
              </div>
              <div className="w-full lg:w-1/2">
                 <div className="bg-brand-accent/10 p-10 rounded-[4rem] border border-brand-accent/20 animate-float">
                    <Icons.LayoutDashboard size={120} className="text-brand-accent opacity-20 mx-auto" />
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Ciclo de Transparência */}
      <section className="py-40 bg-white">
         <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-24">
               <div className="w-full lg:w-1/2 space-y-12">
                  <div className="space-y-4">
                     <h2 className="text-[11px] font-black text-brand-accent uppercase tracking-[0.5em]">Transparência Digital</h2>
                     <h3 className="text-4xl md:text-7xl font-black text-brand-blue font-heading tracking-tighter leading-none italic">Sua prestação de <br/>contas blindada.</h3>
                  </div>
                  <p className="text-lg text-slate-500 font-medium leading-relaxed">
                     O síndico não precisa mais cobrar relatórios. Nossa plataforma automatiza todo o fluxo de evidências, gerando arquivos prontos para a assembleia ou conselho.
                  </p>
                  
                  <div className="space-y-8">
                     {[
                       { t: "Rastreabilidade", d: "Histórico completo de quem, quando e como o serviço foi feito.", i: Icons.Target },
                       { t: "Aprovação Online", d: "Orçamentos aprovados com um clique pelo síndico ou morador.", i: Icons.CheckCircle },
                       { t: "Notificações PUSH", d: "Status atualizado em tempo real no WhatsApp e E-mail.", i: Icons.Bell }
                     ].map((item, idx) => (
                       <div key={idx} className="flex gap-6 group">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-blue shrink-0 group-hover:bg-brand-accent transition-all"><item.i size={24} /></div>
                          <div>
                             <h4 className="text-xl font-black text-brand-blue mb-1">{item.t}</h4>
                             <p className="text-sm text-slate-400 font-medium">{item.d}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="w-full lg:w-1/2 relative">
                  <div className="bg-brand-blue rounded-[4rem] p-12 md:p-20 text-white shadow-premium relative">
                     <Icons.Quote className="absolute top-10 right-10 text-brand-accent opacity-20" size={80} />
                     <h4 className="text-2xl font-black mb-10 italic">Compromisso FacilitiesCON</h4>
                     <ul className="space-y-6">
                        <li className="flex items-start gap-4 text-slate-300 font-medium">
                           <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center text-brand-blue shrink-0 mt-1"><Icons.Check size={14} /></div>
                           <span>Zero taxa oculta. O valor do orçamento é o valor da fatura.</span>
                        </li>
                        <li className="flex items-start gap-4 text-slate-300 font-medium">
                           <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center text-brand-blue shrink-0 mt-1"><Icons.Check size={14} /></div>
                           <span>Garantia técnica integral para serviços estruturais e civis.</span>
                        </li>
                        <li className="flex items-start gap-4 text-slate-300 font-medium">
                           <div className="w-6 h-6 bg-brand-accent rounded-full flex items-center justify-center text-brand-blue shrink-0 mt-1"><Icons.Check size={14} /></div>
                           <span>Atendimento por engenheiros especializados e registrados no CREA.</span>
                        </li>
                     </ul>
                     <div className="mt-12 pt-10 border-t border-white/10 flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-brand-accent"><Icons.Award size={24} /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight">Selo de Qualidade <br/> FacilitiesCON</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* FAQ Técnico */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl">
           <div className="text-center mb-24">
              <h3 className="text-3xl md:text-5xl font-black font-heading tracking-tighter italic">Dúvidas Técnicas Frequentes.</h3>
           </div>
           
           <div className="space-y-6">
              {[
                { q: "Quais condomínios podem ser parceiros?", a: "Atendemos empreendimentos residenciais e comerciais de todos os portes. O condomínio precisa apenas realizar o credenciamento conosco para liberar o acesso aos moradores." },
                { q: "Como funciona a garantia dos reparos?", a: "Cada laudo emitido possui um código de garantia único. Em caso de reincidência, o chamado é reaberto sem custos adicionais em até 48 horas úteis." },
                { q: "Os técnicos são credenciados pela FacilitiesCON?", a: "Sim, operamos com equipe própria CLT e parceiros estratégicos homologados que passam por auditoria técnica e de segurança mensal rigorosa." },
                { q: "A plataforma funciona em qualquer celular?", a: "Sim! Nossa plataforma é um WebApp otimizado. Não requer instalação pesada e funciona em qualquer smartphone moderno com internet." }
              ].map((faq, i) => (
                <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                   <h4 className="text-lg font-black text-brand-accent mb-4">{faq.q}</h4>
                   <p className="text-slate-400 font-medium text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-brand-accent">
         <div className="container mx-auto px-6 text-center space-y-10">
            <h2 className="text-4xl md:text-6xl font-black text-brand-blue font-heading tracking-tighter leading-none italic">Ficou claro? Vamos começar.</h2>
            <p className="text-brand-blue/70 text-lg font-medium max-w-2xl mx-auto">
               Junte-se a mais de 120 condomínios que já profissionalizaram suas manutenções com a tecnologia FacilitiesCON.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <Link to="/register" className="bg-brand-blue text-white px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-premium hover:scale-105 transition-all">Cadastrar Condomínio</Link>
               <a href="https://wa.me/5511988887777" className="bg-white text-brand-blue px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-sm hover:bg-slate-50 transition-all">Falar com Consultor</a>
            </div>
         </div>
      </section>
    </div>
  );
};

export default HowItWorks;
