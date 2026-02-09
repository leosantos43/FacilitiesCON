
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    { 
      icon: Icons.Smartphone, 
      title: "01. Solicitação Digital", 
      desc: "Tudo começa com um clique. O morador ou síndico abre o chamado pelo celular, anexando fotos e vídeos da ocorrência.",
      tech: "SISTEMA: Geração de Protocolo OS (Ordem de Serviço) com Timestamp via Blockchain.",
      details: [
        "Registro Georreferenciado",
        "Anexo de Multimídia",
        "Notificação Imediata via Push"
      ]
    },
    { 
      icon: Icons.Cpu, 
      title: "02. Triagem e Inteligência", 
      desc: "Nossa central de engenharia analisa a complexidade. Não é apenas um agendamento, é uma análise técnica prévia.",
      tech: "ENGINE: Algoritmo de priorização baseado na Matriz de Risco Predial (GUT).",
      details: [
        "Cálculo de Criticidade",
        "Seleção de Especialista Certificado",
        "SLA de Atendimento Definido"
      ]
    },
    { 
      icon: Icons.Calendar, 
      title: "03. Execução Controlada", 
      desc: "O técnico chega ao local. O sistema monitora o tempo de execução e garante que as normas ABNT sejam seguidas.",
      tech: "OPERACIONAL: Check-in via GPS e Checklist Digital de Conformidade Técnica.",
      details: [
        "Rastreio do Técnico em Tempo Real",
        "Controle de Estoque de Materiais",
        "Segurança do Trabalho (EPI Digital)"
      ]
    },
    { 
      icon: Icons.ShieldCheck, 
      title: "04. Laudo e Garantia", 
      desc: "Serviço finalizado? O sistema gera um laudo técnico completo com fotos e parecer do engenheiro responsável.",
      tech: "DOCS: Emissão de PDF com Assinatura Digital e ART de Engenharia vinculada.",
      details: [
        "Relatório Fotográfico Antes/Depois",
        "Certificado de Garantia Ativo",
        "Histórico Eterno na Unidade"
      ]
    }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappUrl = "https://wa.me/5511988887777?text=Olá! Gostaria de falar com um consultor da FacilitiesCON.";

  return (
    <div className="bg-white selection:bg-brand-accent selection:text-brand-blue">
      {/* Hero Processo */}
      <section className="bg-brand-dark text-white py-32 lg:py-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-blue opacity-20"></div>
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-accent rounded-full blur-[150px] opacity-10"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
           <h1 className="text-5xl md:text-8xl font-black font-heading mb-8 leading-none tracking-tighter italic">
             O Método <span className="text-brand-accent">FacilitiesCON</span>.
           </h1>
           <p className="text-xl text-slate-400 leading-relaxed mb-12 font-medium">
             Saiba como levamos a engenharia predial para a era digital. Um passo a passo da nossa excelência operacional.
           </p>
           <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <a href={whatsappUrl} target="_blank" className="bg-brand-accent text-brand-blue font-black py-5 px-12 rounded-2xl shadow-glow hover:scale-105 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3">
               <Icons.MessageCircle size={18} /> Entre em contato agora
             </a>
             <button 
               onClick={() => scrollToSection('fluxo')}
               className="bg-white/5 border border-white/10 text-white font-black py-5 px-12 rounded-2xl hover:bg-white/10 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-3"
             >
               Explorar Passo a Passo <Icons.ArrowRight size={18} />
             </button>
           </div>
        </div>
      </section>

      {/* Passo a Passo Interativo (Fluxograma) */}
      <section id="fluxo" className="py-40 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
           <div className="text-center mb-24 space-y-4">
              <h2 className="text-brand-accent text-[11px] font-black uppercase tracking-[0.5em]">Jornada do Atendimento</h2>
              <h3 className="text-4xl md:text-6xl font-black text-brand-blue font-heading tracking-tighter italic uppercase">Fluxograma de Excelência</h3>
           </div>

           <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* Menu de Passos */}
              <div className="w-full lg:w-1/3 space-y-4">
                 {steps.map((step, idx) => (
                   <button 
                     key={idx}
                     onClick={() => setActiveStep(idx)}
                     className={`w-full text-left p-8 rounded-[2rem] transition-all duration-500 border flex items-center gap-6 group ${
                       activeStep === idx 
                         ? 'bg-brand-blue text-white border-brand-blue shadow-premium translate-x-4' 
                         : 'bg-white text-slate-400 border-slate-100 hover:border-brand-accent/30'
                     }`}
                   >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        activeStep === idx ? 'bg-brand-accent text-brand-blue' : 'bg-slate-50 text-slate-300 group-hover:text-brand-accent'
                      }`}>
                         <step.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-black uppercase tracking-wider ${activeStep === idx ? 'text-brand-accent' : 'text-slate-400'}`}>Passo {idx + 1}</h4>
                        <p className={`font-black text-lg tracking-tight ${activeStep === idx ? 'text-white' : 'text-slate-900'}`}>{step.title.split('. ')[1]}</p>
                      </div>
                      <Icons.ArrowRight size={20} className={`transition-transform ${activeStep === idx ? 'translate-x-0' : '-translate-x-4 opacity-0'}`} />
                   </button>
                 ))}
              </div>

              {/* Detalhamento Visual do Passo */}
              <div className="w-full lg:w-2/3 bg-white border border-slate-100 rounded-[4rem] p-10 md:p-20 shadow-premium min-h-[500px] flex flex-col justify-between animate-in fade-in slide-in-from-right-10 duration-500">
                 <div className="space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                       <div className="space-y-6 max-w-lg">
                          <h3 className="text-4xl md:text-5xl font-black text-brand-blue font-heading tracking-tighter italic uppercase leading-none">
                            {steps[activeStep].title}
                          </h3>
                          <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            {steps[activeStep].desc}
                          </p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {steps[activeStep].details.map((detail, dIdx) => (
                         <div key={dIdx} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <Icons.CheckCircle size={16} className="text-brand-accent shrink-0" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-tight">{detail}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-end items-center gap-8">
                    <button 
                      onClick={() => setActiveStep((activeStep + 1) % steps.length)}
                      className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue flex items-center gap-3 hover:text-brand-accent transition-colors"
                    >
                      Próximo Passo <Icons.ArrowRight size={16} />
                    </button>
                 </div>
              </div>
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
                   Nossa plataforma permite ao síndico analisar tendências de manutenção, prever falhas e otimizar o orçamento condominial com precisão matemática.
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
                 <div className="bg-brand-accent/10 p-10 rounded-[4rem] border border-brand-accent/20 animate-float text-center">
                    <Icons.LayoutDashboard size={120} className="text-brand-accent opacity-20 mx-auto" />
                    <p className="mt-8 text-brand-accent font-black uppercase tracking-[0.3em] text-[10px]">Dashboard de Controle Ativo</p>
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
                  <div className="bg-brand-blue rounded-[4rem] p-12 md:p-20 text-white shadow-premium relative overflow-hidden">
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
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-brand-accent">
         <div className="container mx-auto px-6 text-center space-y-10">
            <h2 className="text-4xl md:text-6xl font-black text-brand-blue font-heading tracking-tighter leading-none italic uppercase">Ficou claro? Vamos profissionalizar seu prédio.</h2>
            <p className="text-brand-blue/70 text-lg font-medium max-w-2xl mx-auto">
               Junte-se a mais de 120 condomínios que já profissionalizaram suas manutenções com a tecnologia FacilitiesCON.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <a href={whatsappUrl} target="_blank" className="bg-brand-blue text-white px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-premium hover:scale-105 transition-all">Entre em contato agora</a>
               <Link to="/register" className="bg-white text-brand-blue px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-sm hover:bg-slate-50 transition-all">Solicitar Demonstração</Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default HowItWorks;
