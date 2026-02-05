
-- ========================================================
-- SCRIPT DE CORREÇÃO DE POLÍTICAS RLS - FACILITIESCON
-- Execute este script no SQL Editor do seu Supabase
-- ========================================================

-- Habilitar RLS em tabelas críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- POLÍTICAS PARA PROFILES
-- ========================================================
DROP POLICY IF EXISTS "Perfis visíveis por autenticados" ON public.profiles;
CREATE POLICY "Perfis visíveis por autenticados" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários editam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários editam próprio perfil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ========================================================
-- POLÍTICAS PARA SERVICE_REQUESTS
-- ========================================================
DROP POLICY IF EXISTS "Ver chamados" ON public.service_requests;
CREATE POLICY "Ver chamados" 
ON public.service_requests FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criar chamados" ON public.service_requests;
CREATE POLICY "Criar chamados" 
ON public.service_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins atualizam chamados" ON public.service_requests;
CREATE POLICY "Admins atualizam chamados" 
ON public.service_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========================================================
-- POLÍTICAS PARA CHAT_MESSAGES (CORREÇÃO DO ERRO 403)
-- ========================================================
DROP POLICY IF EXISTS "Ver mensagens" ON public.chat_messages;
CREATE POLICY "Ver mensagens" 
ON public.chat_messages FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enviar mensagens" ON public.chat_messages;
CREATE POLICY "Enviar mensagens" 
ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- POLÍTICAS PARA NOTIFICAÇÕES
-- ========================================================
DROP POLICY IF EXISTS "Ver próprias notificações" ON public.notifications;
CREATE POLICY "Ver próprias notificações" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Marcar como lida" ON public.notifications;
CREATE POLICY "Marcar como lida" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';
