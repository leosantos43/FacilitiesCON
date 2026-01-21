
-- ========================================================
-- SCRIPT DE CORREÇÃO E ATUALIZAÇÃO - FACILITIESCON
-- Execute este script no SQL Editor do seu Supabase
-- ========================================================

-- 1. Garante que a tabela de perfis tem os campos necessários
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS condo_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS apartment TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;

-- 2. Garante que a tabela de chamados tem as colunas para o Laudo Técnico e Orçamento
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS budget_value NUMERIC(10,2);
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS budget_description TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS technical_report TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS photos_before TEXT[];
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS photos_after TEXT[];
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS professional_id UUID;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS professional_name TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS professional_cpf TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS professional_photo TEXT;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS unit_info TEXT;

-- 3. Criação da tabela de configurações da empresa (caso não exista)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    logo TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criação da tabela de profissionais (caso não exista)
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    specialty TEXT,
    active BOOLEAN DEFAULT true,
    photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Garante que as permissões de acesso (RLS) estão desativadas para o protótipo
-- (Ou configure as políticas conforme sua necessidade de produção)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;

-- 6. COMANDO CRÍTICO: Recarrega o cache do PostgREST para reconhecer as novas colunas
NOTIFY pgrst, 'reload schema';

-- Mensagem de confirmação para o log
DO $$ 
BEGIN 
    RAISE NOTICE 'Esquema FacilitiesCON atualizado e cache recarregado com sucesso.';
END $$;
