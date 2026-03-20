-- Migration: 0001_initial_schema.sql

-- Migration Final - Fixar RefrigeraÃ§Ã£o
-- RESET TOTAL: Remove e recria as tabelas para garantir que o cache do Supabase atualize.

DROP TABLE IF EXISTS public.differentiators CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.site_config CASCADE;

-- 1. Tabela Site Config (Singleton)
CREATE TABLE public.site_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    hero_badge TEXT DEFAULT 'LÃ­der em ClimatizaÃ§Ã£o',
    hero_title TEXT DEFAULT 'Fixar RefrigeraÃ§Ã£o: ExcelÃªncia em ClimatizaÃ§Ã£o',
    hero_subtitle TEXT DEFAULT 'Garantimos o melhor desempenho para seus equipamentos com soluÃ§Ãµes tÃ©cnicas especializadas e atendimento de alta confiabilidade em Arapongas e regiÃ£o.',
    hero_cta_text TEXT DEFAULT 'ConheÃ§a Nossos ServiÃ§os',
    hero_cta_link TEXT DEFAULT '#servicos',
    logo_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjvvckANKF6rGDv1i_iyAczrEcRtgDtdxEK0cuJGIyrVyH4JLX4II_Hj-svVNDIQvjdciFuWg_FKtBUOL0AtIeERUpJvO6mGOaOH8jmi_sFltFWWAl_PbvPdrFDch6rPWdQdXb39Feac_NDD6z9CJSpng1jirnVtR0BH43uk2Cu0q0Qs5ZrN4EpN3ULKzwrVJXk2VNVYJZUHuX01uA07y2AgQH7ci97_GdBQRTcSVtFSJJqAzU6emJSi-DzK0foUcs7SnGRIDFO8Y',
    hero_image_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjvvckANKF6rGDv1i_iyAczrEcRtgDtdxEK0cuJGIyrVyH4JLX4II_Hj-svVNDIQvjdciFuWg_FKtBUOL0AtIeERUpJvO6mGOaOH8jmi_sFltFWWAl_PbvPdrFDch6rPWdQdXb39Feac_NDD6z9CJSpng1jirnVtR0BH43uk2Cu0q0Qs5ZrN4EpN3ULKzwrVJXk2VNVYJZUHuX01uA07y2AgQH7ci97_GdBQRTcSVtFSJJqAzU6emJSi-DzK0foUcs7SnGRIDFO8Y',
    about_title TEXT DEFAULT 'Sobre a Fixar RefrigeraÃ§Ã£o',
    about_description TEXT DEFAULT 'A Fixar RefrigeraÃ§Ã£o Ã© referÃªncia em soluÃ§Ãµes tÃ©rmicas em Arapongas e regiÃ£o. Combinamos expertise tÃ©cnica avanÃ§ada com um compromisso inabalÃ¡vel com a satisfaÃ§Ã£o do cliente, garantindo que seu ambiente esteja sempre na temperatura ideal com mÃ¡xima eficiÃªncia energÃ©tica.',
    services_title TEXT DEFAULT 'Nossos ServiÃ§os Especializados',
    services_subtitle TEXT DEFAULT 'Oferecemos uma gama completa de serviÃ§os para manter seu clima sempre perfeito com qualidade profissional.',
    diferenciais_title TEXT DEFAULT 'Por que escolher a Fixar RefrigeraÃ§Ã£o?',
    contato_title TEXT DEFAULT 'Fale com Nossos Especialistas',
    contato_subtitle TEXT DEFAULT 'Atendimento especializado em Arapongas e toda a regiÃ£o.',
    contato_whatsapp TEXT DEFAULT '5543988053145',
    contato_email TEXT DEFAULT 'fixar.tec@hotmail.com',
    contato_address TEXT DEFAULT 'Arapongas e regiÃ£o',
    footer_text TEXT DEFAULT 'Sua melhor escolha em climatizaÃ§Ã£o. Atuamos com as melhores marcas do mercado oferecendo um serviÃ§o premium para sua casa ou empresa.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- 2. Tabela de ServiÃ§os
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Diferenciais
CREATE TABLE public.differentiators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon TEXT,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir Dados Iniciais
INSERT INTO public.site_config (id) VALUES (1);

INSERT INTO public.services (title, description, image_url, "order") VALUES 
('InstalaÃ§Ã£o', 'InstalaÃ§Ã£o profissional de ar-condicionado de todos os modelos e marcas com precisÃ£o tÃ©cnica.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCypbz4nrlhTasCnY3RuX8xQBs9k_fpabxA1CeYaLBlwJmUyXDTRLxQWbzGIXM83b6sUDkHbxWW8GAPsWTYkjAfBCpfaP88hpbHtQtPBAes9NDnN8ySFUkFRkk6r802a6BNG4-Bz_IM8UeMFFsHktvkVV_ivvMNUNx9KjyNmc3WIj-HlkhJQCkAWu4HC3JIW_UjpJ2yjHRo2osE8uv9Y4OcrXCLjIiHEQt6QKCJKDS020WxHJRg8aqd24Oi6W1AlYiMcJYnAUA_dx4', 1),
('ManutenÃ§Ã£o', 'Preventiva e corretiva para garantir vida Ãºtil e ar mais puro no ambiente residencial ou comercial.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeg-gXt9OltwjUZyXiXPchp8WBchdPmPkj1Jl5MGgR71wAzRfkWgMbLROYI-cYifXywL0Mx20QYDUZYHLnK31QzLdYcg6xxf17wtS03cEJmOnjv0YW-n_g-i4RNVGLveCVyKKXI8tFV2vGbYP0aCfqzGhWKMfVYtBrU4-r98JwVU0R3-zG_5sS9kPAzo_ub2DW06z8EfryVQBDQH0W4i9KASIk8_Bp_MZkGAghc8s4uLa8N7KiKQ2R7ScSlJwIm_8ojvs87Voak7A', 2),
('Comercial', 'SoluÃ§Ãµes para cÃ¢maras frias, balcÃµes e sistemas centrais de refrigeraÃ§Ã£o industrial.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmJcAyxymORjFcLs7TcqQhma7QbKKPlaPv8iVu0e1qZixGzPJRdsSwQgb2eOVG1SWH4H9apGccPFkk2wK6bTGaZaD0o_lhQIwNqbik2Nrqs9oShgSE9pJsGWozqOfTplAHKnMLW_7ZQUQWi1uwabeNUAmkbn-U1LfSFb7B6uYSgEhtAsM9xSzNPkTdqJH7rFG_L1BTr-D6yYmrMYCGWF4_TmDVfuKv_iW8Etti-Ju2ynibkAglyQeMhIQj895DGMK6o-KESHC4bjY', 3),
('Reparo TÃ©cnico', 'DiagnÃ³stico preciso e troca de peÃ§as originais com garantia total de serviÃ§o.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD7VfT9E9XJNZt3NVNm_8oyxyYy4xojizAlGrbK0C-Pxv0rZsJl5qSD02zTmNfHFtidTMFpTS10AKVnwnZQCaHCJDF5pvWujigW732wEluzaGTtu2Oh9lYtvNnWYBgi1Q5H5FbzyQzEcRU0n3j6DNFxZmE5HMK01J4ZIkgnEad_VQJfKxZGgkcXPd7FSlEK3UuM8wELnVLnCEiqtV-wrcwRr_Q8FJZBdLGC9htUVHhkGgZP12KCssPGclR4c_nKQ6FIqwRRm19qyI', 4);

INSERT INTO public.differentiators (icon, title, description, "order") VALUES 
('groups', 'Equipe Especializada', 'TÃ©cnicos altamente treinados e certificados pelas principais fabricantes do mercado, garantindo excelÃªncia em cada serviÃ§o.', 1),
('bolt', 'Atendimento RÃ¡pido', 'Entendemos a urgÃªncia de um ambiente sem climatizaÃ§Ã£o. Por isso, priorizamos agilidade e eficiÃªncia em Arapongas e regiÃ£o.', 2),
('security', 'Garantia de ServiÃ§o', 'Sua tranquilidade Ã© nossa prioridade. Todos os nossos serviÃ§os contam com garantia formalizada e acompanhamento pÃ³s-execuÃ§Ã£o.', 3);

-- 5. Ativar RLS e PolÃ­ticas
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.differentiators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access to site_config" ON public.site_config;
CREATE POLICY "Allow public read-only access to site_config" ON public.site_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read-only access to services" ON public.services;
CREATE POLICY "Allow public read-only access to services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read-only access to differentiators" ON public.differentiators;
CREATE POLICY "Allow public read-only access to differentiators" ON public.differentiators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update to site_config" ON public.site_config;
CREATE POLICY "Allow update to site_config" ON public.site_config FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow full access to services" ON public.services;
CREATE POLICY "Allow full access to services" ON public.services FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow full access to differentiators" ON public.differentiators;
CREATE POLICY "Allow full access to differentiators" ON public.differentiators FOR ALL USING (true);

-- 6. PolÃ­ticas de acesso para o Storage (Imagens)
-- Nota: Estas polÃ­ticas devem ser aplicadas ao bucket 'site-assets'

-- Permitir upload pÃºblico (InserÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir upload pÃºblico" ON storage.objects;
CREATE POLICY "Permitir upload pÃºblico"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'site-assets');

-- Permitir update pÃºblico (AtualizaÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir update pÃºblico" ON storage.objects;
CREATE POLICY "Permitir update pÃºblico"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'site-assets');

-- Permitir visualizaÃ§Ã£o pÃºblica (SeleÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir visualizaÃ§Ã£o pÃºblica" ON storage.objects;
CREATE POLICY "Permitir visualizaÃ§Ã£o pÃºblica"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');


-- Migration: 0002_auth_profiles.sql

-- Migration: Auth Profiles & Roles
-- Cria tabela de perfis vinculada ao auth.users do Supabase

-- 1. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name TEXT,
  avatar_url TEXT,             -- foto de perfil
  source TEXT,                -- como encontrou (google, facebook, instagram, etc)
  document TEXT,              -- CPF ou CNPJ (nÃ£o obrigatÃ³rio)
  email TEXT NOT NULL,
  whatsapp TEXT,
  cep TEXT,
  street TEXT,                -- rua
  number TEXT,                -- nÃºmero
  complement TEXT,            -- complemento
  neighborhood TEXT,          -- bairro
  city TEXT,                  -- cidade
  state TEXT,                 -- estado
  birthday DATE,              -- data de aniversÃ¡rio
  notes TEXT,                 -- anotaÃ§Ãµes
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger: criar perfil automaticamente ao criar usuÃ¡rio no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, must_change_password, avatar_url,
    source, document, whatsapp, cep, street, number,
    complement, neighborhood, city, state, birthday, notes
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com') THEN 'admin'
      ELSE 'client'
    END,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'source',
    NEW.raw_user_meta_data->>'document',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'cep',
    NEW.raw_user_meta_data->>'street',
    NEW.raw_user_meta_data->>'number',
    NEW.raw_user_meta_data->>'complement',
    NEW.raw_user_meta_data->>'neighborhood',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    CASE WHEN NEW.raw_user_meta_data->>'birthday' IS NOT NULL AND NEW.raw_user_meta_data->>'birthday' != '' 
      THEN (NEW.raw_user_meta_data->>'birthday')::date ELSE NULL END,
    NEW.raw_user_meta_data->>'notes'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo (verificando via JWT para evitar recursÃ£o)
DROP POLICY IF EXISTS "Admins full access" ON public.profiles;
CREATE POLICY "Admins full access" ON public.profiles
  FOR ALL
  USING (
    (auth.jwt() ->> 'email') IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com')
  );

-- Clientes podem ler apenas seu prÃ³prio perfil
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Clientes podem atualizar apenas seu prÃ³prio perfil
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Permitir inserÃ§Ã£o via trigger (service role)
DROP POLICY IF EXISTS "Service insert profiles" ON public.profiles;
CREATE POLICY "Service insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (true);


-- Migration: 0003_add_contacts_to_profiles.sql

-- Migration: Add contacts column to profiles
-- Adiciona suporte para mÃºltiplos contatos por cliente

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;

-- Atualiza a funÃ§Ã£o trigger para incluir o campo contacts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, role, must_change_password, avatar_url,
    source, document, whatsapp, cep, street, number,
    complement, neighborhood, city, state, birthday, notes,
    contacts
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com') THEN 'admin'
      ELSE 'client'
    END,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'source',
    NEW.raw_user_meta_data->>'document',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'cep',
    NEW.raw_user_meta_data->>'street',
    NEW.raw_user_meta_data->>'number',
    NEW.raw_user_meta_data->>'complement',
    NEW.raw_user_meta_data->>'neighborhood',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    CASE WHEN NEW.raw_user_meta_data->>'birthday' IS NOT NULL AND NEW.raw_user_meta_data->>'birthday' != '' 
      THEN (NEW.raw_user_meta_data->>'birthday')::date ELSE NULL END,
    NEW.raw_user_meta_data->>'notes',
    COALESCE((NEW.raw_user_meta_data->>'contacts')::jsonb, '[]'::jsonb)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Migration: 0004_create_equipments_table.sql

-- Migration: 0004_create_equipments_table.sql
-- Cria a tabela de equipamentos e define polÃ­ticas de acesso (RLS)

CREATE TABLE IF NOT EXISTS public.equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    photo_url TEXT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    environment TEXT,
    model TEXT,
    capacity TEXT,
    voltage TEXT,
    refrigerant_fluid TEXT,
    has_contract BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica: Administradores tÃªm acesso total
DROP POLICY IF EXISTS "Admins full access to equipments" ON public.equipments;
CREATE POLICY "Admins full access to equipments" ON public.equipments
    FOR ALL
    USING (
        (auth.jwt() ->> 'email') IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com')
    );

-- PolÃ­tica: Clientes podem visualizar apenas seus prÃ³prios equipamentos
DROP POLICY IF EXISTS "Users read own equipments" ON public.equipments;
CREATE POLICY "Users read own equipments" ON public.equipments
    FOR SELECT
    USING (
        client_id = auth.uid()
    );

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_equipment_updated ON public.equipments;
CREATE TRIGGER on_equipment_updated
    BEFORE UPDATE ON public.equipments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- Migration: 0005_add_brand_column.sql

-- Migration: Add brand column to equipments table
ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS brand TEXT;

-- Refresh PostgREST cache (optional but helpful in some environments)
NOTIFY pgrst, 'reload schema';


-- Migration: 0006_create_service_items.sql

-- Migration: Create service_items table for internal service catalog
-- This table is separate from the landing page 'services' table.

CREATE TABLE IF NOT EXISTS public.service_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    estimated_time TEXT, -- Optional (e.g., "1h 30m", "2h", etc.)
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins: full access
DROP POLICY IF EXISTS "Admins full access on service_items" ON public.service_items;
CREATE POLICY "Admins full access on service_items" ON public.service_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Everyone (authenticated): read access
DROP POLICY IF EXISTS "Anyone can view service_items" ON public.service_items;
CREATE POLICY "Anyone can view service_items" ON public.service_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_service_items()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_service_item_updated ON public.service_items;
CREATE TRIGGER on_service_item_updated
    BEFORE UPDATE ON public.service_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_service_items();


-- Migration: 0007_create_stock_table.sql

-- Migration: Create stock_items table
-- This table stores parts, tools, and supplies for internal management.

CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    details TEXT,
    barcode TEXT,
    internal_code TEXT,
    brand TEXT,
    unit TEXT DEFAULT 'UN', -- e.g., UN, KG, L, M
    
    -- Financials
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    profit_margin DECIMAL(10, 2) DEFAULT 0.00,
    markup_percentage DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Inventory
    current_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins: full access
DROP POLICY IF EXISTS "Admins full access on stock_items" ON public.stock_items;
CREATE POLICY "Admins full access on stock_items" ON public.stock_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Everyone (authenticated): read access
DROP POLICY IF EXISTS "Anyone can view stock_items" ON public.stock_items;
CREATE POLICY "Anyone can view stock_items" ON public.stock_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_stock_items()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_stock_item_updated ON public.stock_items;
CREATE TRIGGER on_stock_item_updated
    BEFORE UPDATE ON public.stock_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_stock_items();


-- Migration: 0008_create_orders_table.sql

-- Migration: 0008_create_orders_table.sql
-- Tabela de pedidos vinculada a equipamentos, serviÃ§os e peÃ§as

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE,
    description TEXT,
    validity_days INTEGER DEFAULT 30,
    notes TEXT,
    image_url TEXT,
    status public.order_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) -- O admin que criou o pedido
);

-- Tabela de ServiÃ§os do Pedido (Snapshot para manter histÃ³rico de preÃ§os)
CREATE TABLE IF NOT EXISTS public.order_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    service_item_id UUID REFERENCES public.service_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de PeÃ§as do Pedido (Snapshot para manter histÃ³rico de preÃ§os)
CREATE TABLE IF NOT EXISTS public.order_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_parts ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas para Admins (Acesso Total)
DROP POLICY IF EXISTS "Admins full access to orders" ON public.orders;
CREATE POLICY "Admins full access to orders" ON public.orders
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to order_services" ON public.order_services;
CREATE POLICY "Admins full access to order_services" ON public.order_services
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins full access to order_parts" ON public.order_parts;
CREATE POLICY "Admins full access to order_parts" ON public.order_parts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- PolÃ­ticas para Clientes (Ver apenas os seus)
DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;
CREATE POLICY "Clients can view own orders" ON public.orders
    FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view own order_services" ON public.order_services;
CREATE POLICY "Clients can view own order_services" ON public.order_services
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_services.order_id
            AND orders.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clients can view own order_parts" ON public.order_parts;
CREATE POLICY "Clients can view own order_parts" ON public.order_parts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_parts.order_id
            AND orders.client_id = auth.uid()
        )
    );

-- Trigger para updated_at na tabela orders
CREATE OR REPLACE FUNCTION public.handle_updated_at_orders()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at_orders();


-- Migration: 0009_add_unit_to_order_items.sql

-- Migration: 0009_add_unit_to_order_items.sql
-- Adiciona a coluna unidade para serviÃ§os e peÃ§as nos pedidos

ALTER TABLE public.order_services ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'un.';
ALTER TABLE public.order_parts ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'un.';


-- Migration: 0010_fix_missing_columns.sql

-- Migration: 0010_fix_missing_columns.sql
-- Adiciona colunas faltantes para garantir o funcionamento correto de serviÃ§os e peÃ§as nos pedidos

DO $$ 
BEGIN
    -- order_services
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_services' AND column_name='quantity') THEN
        ALTER TABLE public.order_services ADD COLUMN quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00;
    END IF;

    -- order_parts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_parts' AND column_name='quantity') THEN
        ALTER TABLE public.order_parts ADD COLUMN quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_parts' AND column_name='description') THEN
        ALTER TABLE public.order_parts ADD COLUMN description TEXT;
    END IF;
END $$;


-- Migration: 0011_maintenance_checklist.sql

-- Migration: 0011_maintenance_checklist.sql
-- Adiciona colunas para controle de contrato e histÃ³rico de manutenÃ§Ã£o

-- 1. Adicionar colunas de controle de contrato na tabela de equipamentos
ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS contract_periodicity TEXT DEFAULT 'monthly' CHECK (contract_periodicity IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'));
ALTER TABLE public.equipments ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMPTZ;

-- 2. Criar tabela de logs de manutenÃ§Ã£o
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.profiles(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    checklist_data JSONB NOT NULL,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 4. PolÃ­ticas de acesso
DROP POLICY IF EXISTS "Admins full access to maintenance_logs" ON public.maintenance_logs;
CREATE POLICY "Admins full access to maintenance_logs" ON public.maintenance_logs
    FOR ALL USING ((auth.jwt() ->> 'email') IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com'));

DROP POLICY IF EXISTS "Users view own equipment maintenance_logs" ON public.maintenance_logs;
CREATE POLICY "Users view own equipment maintenance_logs" ON public.maintenance_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.equipments 
            WHERE equipments.id = maintenance_logs.equipment_id 
            AND equipments.client_id = auth.uid()
        )
    );


-- Migration: 0012_multiple_contracts.sql

-- Migration: 0012_multiple_contracts.sql
-- Adiciona suporte a mÃºltiplos contratos por equipamento

-- 1. Criar tabela de contratos
CREATE TABLE IF NOT EXISTS public.equipment_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    periodicity TEXT DEFAULT 'monthly' CHECK (periodicity IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
    next_maintenance_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar contract_id aos logs de manutenÃ§Ã£o
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.equipment_contracts(id) ON DELETE SET NULL;

-- 3. Inserir contratos existentes (migraÃ§Ã£o de dados)
-- Para cada equipamento que tem 'has_contract = true', cria um contrato padrÃ£o
INSERT INTO public.equipment_contracts (equipment_id, name, type, periodicity, next_maintenance_date)
SELECT 
    id, 
    'Contrato PadrÃ£o', 
    'ManutenÃ§Ã£o Preventiva', 
    contract_periodicity, 
    next_maintenance_date
FROM public.equipments
WHERE has_contract = true;

-- 4. Habilitar RLS
ALTER TABLE public.equipment_contracts ENABLE ROW LEVEL SECURITY;

-- 5. PolÃ­ticas de acesso
DROP POLICY IF EXISTS "Admins full access to equipment_contracts" ON public.equipment_contracts;
CREATE POLICY "Admins full access to equipment_contracts" ON public.equipment_contracts
    FOR ALL USING ((auth.jwt() ->> 'email') IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com'));

DROP POLICY IF EXISTS "Users view own equipment contracts" ON public.equipment_contracts;
CREATE POLICY "Users view own equipment contracts" ON public.equipment_contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.equipments 
            WHERE equipments.id = equipment_contracts.equipment_id 
            AND equipments.client_id = auth.uid()
        )
    );


-- Migration: 0013_checklist_persistence.sql

-- Migration: 0013_checklist_persistence.sql
-- Adiciona suporte para persistÃªncia de itens personalizados no checklist

ALTER TABLE public.equipment_contracts ADD COLUMN IF NOT EXISTS checklist_template JSONB;

-- ComentÃ¡rio para documentar o campo
COMMENT ON COLUMN public.equipment_contracts.checklist_template IS 'Lista de itens de verificaÃ§Ã£o personalizados para este contrato especÃ­fico.';


-- Migration: 0014_add_updated_at_to_maintenance_logs.sql

-- Migration: 0014_add_updated_at_to_maintenance_logs.sql
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- Migration: 0015_add_technician_name_to_maintenance_logs.sql

-- Migration: 0015_add_technician_name_to_maintenance_logs.sql
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS technician_name TEXT DEFAULT 'Equipe TÃ©cnica Fixar';


-- Migration: 0016_technicians_table.sql

-- Migration: 0016_technicians_table.sql
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT, -- CPF or Council Registration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to maintenance_logs for persistence of technician details at the time of service
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES public.technicians(id);
ALTER TABLE public.maintenance_logs ADD COLUMN IF NOT EXISTS technician_document TEXT;


-- Migration: 0017_add_updated_at_to_technicians.sql

-- Migration: 0017_add_updated_at_to_technicians.sql
ALTER TABLE public.technicians ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- Migration: 0018_fix_technician_fk.sql

-- Migration: 0018_fix_technician_fk.sql
-- Drop the potentially misconfigured constraint
ALTER TABLE public.maintenance_logs DROP CONSTRAINT IF EXISTS maintenance_logs_technician_id_fkey;

-- Ensure technician_id column is correct
ALTER TABLE public.maintenance_logs ALTER COLUMN technician_id SET DATA TYPE UUID;

-- Re-add the constraint pointing explicitly to technicians(id)
ALTER TABLE public.maintenance_logs 
ADD CONSTRAINT maintenance_logs_technician_id_fkey 
FOREIGN KEY (technician_id) 
REFERENCES public.technicians(id) 
ON DELETE SET NULL;


-- Migration: 0019_agenda_enhancements.sql

-- Migration: 0019_agenda_enhancements.sql
-- Adiciona campos de agendamento e prioridade na tabela de pedidos (orders)

-- 1. Adicionar colunas
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- 2. Indexar para consultas de agenda
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_at ON public.orders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_equipment_contracts_next_maintenance ON public.equipment_contracts(next_maintenance_date);


-- Migration: 0020_financial_module.sql

-- Migration 0020: Financial Module Enhancements

-- 1. Create financial_records table
CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')) DEFAULT 'pending',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')) DEFAULT 'income',
    category TEXT NOT NULL DEFAULT 'other', -- 'order', 'contract', 'part', 'service', 'other'
    
    -- Relationships
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES equipment_contracts(id) ON DELETE SET NULL,
    equipment_id UUID REFERENCES equipments(id) ON DELETE SET NULL
);

-- 2. Create financial_documents table (for NFs and Receipts)
CREATE TABLE IF NOT EXISTS financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'other')) DEFAULT 'invoice',
    notes TEXT,
    
    -- Relationships
    record_id UUID REFERENCES financial_records(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES equipment_contracts(id) ON DELETE SET NULL,
    equipment_id UUID REFERENCES equipments(id) ON DELETE SET NULL
);

-- 3. Add financial_status to orders to track if it's been billed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS financial_status TEXT DEFAULT 'pending';
ALTER TABLE equipment_contracts ADD COLUMN IF NOT EXISTS financial_status TEXT DEFAULT 'pending';

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_records_client ON financial_records(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_order ON financial_records(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_financial_documents_record ON financial_documents(record_id);

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_financial_records_updated_at
    BEFORE UPDATE ON financial_records
    FOR EACH ROW
    EXECUTE PROCEDURE update_financial_records_updated_at();


-- Migration: 0021_add_contract_value.sql

-- Adicionar coluna de valor mensal aos contratos de equipamentos
ALTER TABLE public.equipment_contracts ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10, 2) DEFAULT 0;

-- ComentÃ¡rio para documentaÃ§Ã£o
COMMENT ON COLUMN public.equipment_contracts.monthly_price IS 'Valor mensal do contrato de manutenÃ§Ã£o (R$).';


-- Migration: 0022_contract_duration.sql

-- Adicionar data de inÃ­cio e duraÃ§Ã£o aos contratos
ALTER TABLE public.equipment_contracts ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.equipment_contracts ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 12;

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON COLUMN public.equipment_contracts.start_date IS 'Data de inÃ­cio de vigÃªncia do contrato.';
COMMENT ON COLUMN public.equipment_contracts.duration_months IS 'DuraÃ§Ã£o total do contrato em meses.';


-- Migration: 0023_normalize_contract_start_dates.sql

-- Migration: 0023_normalize_contract_start_dates.sql
-- Garante que contratos antigos tenham uma data de inÃ­cio para o faturamento retroativo

UPDATE public.equipment_contracts
SET start_date = created_at::date
WHERE start_date IS NULL;

-- Garantir que o valor mensal nÃ£o seja nulo para evitar erros no cÃ¡lculo
UPDATE public.equipment_contracts
SET monthly_price = 0
WHERE monthly_price IS NULL;


-- Migration: 0024_restructure_contracts.sql

-- Migration: 0024_restructure_contracts.sql
-- Reestrutura os contratos para serem do cliente e suportarem mÃºltiplos equipamentos

-- 1. Limpar dados de teste (Contratos e Registros Financeiros vinculados a contratos)
-- Deletar registros financeiros de faturamento de contrato
DELETE FROM public.financial_records WHERE contract_id IS NOT NULL;

-- Logs de manutenÃ§Ã£o: desvincular do contrato (mantendo o log histÃ³rico)
UPDATE public.maintenance_logs SET contract_id = NULL WHERE contract_id IS NOT NULL;

-- Limpar a tabela de contratos atual (reset de testes conforme autorizado)
DELETE FROM public.equipment_contracts;

-- 2. Modificar a tabela equipment_contracts
-- Adicionar client_id (o contrato agora pertence ao cliente)
ALTER TABLE public.equipment_contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tornar equipment_id opcional (serÃ¡ usado apenas como referÃªncia ou depreciado em favor da tabela de junÃ§Ã£o)
ALTER TABLE public.equipment_contracts ALTER COLUMN equipment_id DROP NOT NULL;

-- 3. Criar tabela de junÃ§Ã£o para mÃºltiplos equipamentos por contrato
CREATE TABLE IF NOT EXISTS public.contract_equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.equipment_contracts(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contract_id, equipment_id)
);

-- 4. Habilitar RLS na nova tabela
ALTER TABLE public.contract_equipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to contract_equipments" ON public.contract_equipments;
CREATE POLICY "Admins full access to contract_equipments" ON public.contract_equipments
    FOR ALL USING ((auth.jwt() ->> 'email') IN ('jhefesonn@hotmail.com', 'fixar.tec@hotmail.com'));

DROP POLICY IF EXISTS "Users view own contract equipment links" ON public.contract_equipments;
CREATE POLICY "Users view own contract equipment links" ON public.contract_equipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.equipments 
            WHERE equipments.id = contract_equipments.equipment_id 
            AND equipments.client_id = auth.uid()
        )
    );

-- 5. Atualizar polÃ­ticas da equipment_contracts para usar o client_id diretamente
DROP POLICY IF EXISTS "Users view own equipment contracts" ON public.equipment_contracts;
CREATE POLICY "Users view own equipment contracts" ON public.equipment_contracts
    FOR SELECT USING (client_id = auth.uid());


-- Migration: 0025_site_config.sql

-- CriaÃ§Ã£o das tabelas do site institucional CMS

DROP TABLE IF EXISTS public.differentiators CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.site_config CASCADE;

-- 1. Tabela Site Config (Singleton)
CREATE TABLE public.site_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    hero_badge TEXT DEFAULT 'LÃ­der em ClimatizaÃ§Ã£o',
    hero_title TEXT DEFAULT 'Fixar RefrigeraÃ§Ã£o: ExcelÃªncia em ClimatizaÃ§Ã£o',
    hero_subtitle TEXT DEFAULT 'Garantimos o melhor desempenho para seus equipamentos com soluÃ§Ãµes tÃ©cnicas especializadas e atendimento de alta confiabilidade em Arapongas e regiÃ£o.',
    hero_cta_text TEXT DEFAULT 'ConheÃ§a Nossos ServiÃ§os',
    hero_cta_link TEXT DEFAULT '#servicos',
    logo_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjvvckANKF6rGDv1i_iyAczrEcRtgDtdxEK0cuJGIyrVyH4JLX4II_Hj-svVNDIQvjdciFuWg_FKtBUOL0AtIeERUpJvO6mGOaOH8jmi_sFltFWWAl_PbvPdrFDch6rPWdQdXb39Feac_NDD6z9CJSpng1jirnVtR0BH43uk2Cu0q0Qs5ZrN4EpN3ULKzwrVJXk2VNVYJZUHuX01uA07y2AgQH7ci97_GdBQRTcSVtFSJJqAzU6emJSi-DzK0foUcs7SnGRIDFO8Y',
    hero_image_url TEXT DEFAULT 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjvvckANKF6rGDv1i_iyAczrEcRtgDtdxEK0cuJGIyrVyH4JLX4II_Hj-svVNDIQvjdciFuWg_FKtBUOL0AtIeERUpJvO6mGOaOH8jmi_sFltFWWAl_PbvPdrFDch6rPWdQdXb39Feac_NDD6z9CJSpng1jirnVtR0BH43uk2Cu0q0Qs5ZrN4EpN3ULKzwrVJXk2VNVYJZUHuX01uA07y2AgQH7ci97_GdBQRTcSVtFSJJqAzU6emJSi-DzK0foUcs7SnGRIDFO8Y',
    about_title TEXT DEFAULT 'Sobre a Fixar RefrigeraÃ§Ã£o',
    about_description TEXT DEFAULT 'A Fixar RefrigeraÃ§Ã£o Ã© referÃªncia em soluÃ§Ãµes tÃ©rmicas em Arapongas e regiÃ£o. Combinamos expertise tÃ©cnica avanÃ§ada com um compromisso inabalÃ¡vel com a satisfaÃ§Ã£o do cliente, garantindo que seu ambiente esteja sempre na temperatura ideal com mÃ¡xima eficiÃªncia energÃ©tica.',
    services_title TEXT DEFAULT 'Nossos ServiÃ§os Especializados',
    services_subtitle TEXT DEFAULT 'Oferecemos uma gama completa de serviÃ§os para manter seu clima sempre perfeito com qualidade profissional.',
    diferenciais_title TEXT DEFAULT 'Por que escolher a Fixar RefrigeraÃ§Ã£o?',
    contato_title TEXT DEFAULT 'Fale com Nossos Especialistas',
    contato_subtitle TEXT DEFAULT 'Atendimento especializado em Arapongas e toda a regiÃ£o.',
    contato_whatsapp TEXT DEFAULT '5543988053145',
    contato_email TEXT DEFAULT 'fixar.tec@hotmail.com',
    contato_address TEXT DEFAULT 'Arapongas e regiÃ£o',
    footer_text TEXT DEFAULT 'Sua melhor escolha em climatizaÃ§Ã£o. Atuamos com as melhores marcas do mercado oferecendo um serviÃ§o premium para sua casa ou empresa.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- 2. Tabela de ServiÃ§os
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Diferenciais
CREATE TABLE public.differentiators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon TEXT,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir Dados Iniciais
INSERT INTO public.site_config (id) VALUES (1);

INSERT INTO public.services (title, description, image_url, "order") VALUES 
('InstalaÃ§Ã£o', 'InstalaÃ§Ã£o profissional de ar-condicionado de todos os modelos e marcas com precisÃ£o tÃ©cnica.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCypbz4nrlhTasCnY3RuX8xQBs9k_fpabxA1CeYaLBlwJmUyXDTRLxQWbzGIXM83b6sUDkHbxWW8GAPsWTYkjAfBCpfaP88hpbHtQtPBAes9NDnN8ySFUkFRkk6r802a6BNG4-Bz_IM8UeMFFsHktvkVV_ivvMNUNx9KjyNmc3WIj-HlkhJQCkAWu4HC3JIW_UjpJ2yjHRo2osE8uv9Y4OcrXCLjIiHEQt6QKCJKDS020WxHJRg8aqd24Oi6W1AlYiMcJYnAUA_dx4', 1),
('ManutenÃ§Ã£o', 'Preventiva e corretiva para garantir vida Ãºtil e ar mais puro no ambiente residencial ou comercial.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeg-gXt9OltwjUZyXiXPchp8WBchdPmPkj1Jl5MGgR71wAzRfkWgMbLROYI-cYifXywL0Mx20QYDUZYHLnK31QzLdYcg6xxf17wtS03cEJmOnjv0YW-n_g-i4RNVGLveCVyKKXI8tFV2vGbYP0aCfqzGhWKMfVYtBrU4-r98JwVU0R3-zG_5sS9kPAzo_ub2DW06z8EfryVQBDQH0W4i9KASIk8_Bp_MZkGAghc8s4uLa8N7KiKQ2R7ScSlJwIm_8ojvs87Voak7A', 2),
('Comercial', 'SoluÃ§Ãµes para cÃ¢maras frias, balcÃµes e sistemas centrais de refrigeraÃ§Ã£o industrial.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmJcAyxymORjFcLs7TcqQhma7QbKKPlaPv8iVu0e1qZixGzPJRdsSwQgb2eOVG1SWH4H9apGccPFkk2wK6bTGaZaD0o_lhQIwNqbik2Nrqs9oShgSE9pJsGWozqOfTplAHKnMLW_7ZQUQWi1uwabeNUAmkbn-U1LfSFb7B6uYSgEhtAsM9xSzNPkTdqJH7rFG_L1BTr-D6yYmrMYCGWF4_TmDVfuKv_iW8Etti-Ju2ynibkAglyQeMhIQj895DGMK6o-KESHC4bjY', 3),
('Reparo TÃ©cnico', 'DiagnÃ³stico preciso e troca de peÃ§as originais com garantia total de serviÃ§o.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDD7VfT9E9XJNZt3NVNm_8oyxyYy4xojizAlGrbK0C-Pxv0rZsJl5qSD02zTmNfHFtidTMFpTS10AKVnwnZQCaHCJDF5pvWujigW732wEluzaGTtu2Oh9lYtvNnWYBgi1Q5H5FbzyQzEcRU0n3j6DNFxZmE5HMK01J4ZIkgnEad_VQJfKxZGgkcXPd7FSlEK3UuM8wELnVLnCEiqtV-wrcwRr_Q8FJZBdLGC9htUVHhkGgZP12KCssPGclR4c_nKQ6FIqwRRm19qyI', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.differentiators (icon, title, description, "order") VALUES 
('groups', 'Equipe Especializada', 'TÃ©cnicos altamente treinados e certificados pelas principais fabricantes do mercado, garantindo excelÃªncia em cada serviÃ§o.', 1),
('bolt', 'Atendimento RÃ¡pido', 'Entendemos a urgÃªncia de um ambiente sem climatizaÃ§Ã£o. Por isso, priorizamos agilidade e eficiÃªncia em Arapongas e regiÃ£o.', 2),
('security', 'Garantia de ServiÃ§o', 'Sua tranquilidade Ã© nossa prioridade. Todos os nossos serviÃ§os contam com garantia formalizada e acompanhamento pÃ³s-execuÃ§Ã£o.', 3)
ON CONFLICT DO NOTHING;

-- 5. Ativar RLS e PolÃ­ticas
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.differentiators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access to site_config" ON public.site_config;
CREATE POLICY "Allow public read-only access to site_config" ON public.site_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read-only access to services" ON public.services;
CREATE POLICY "Allow public read-only access to services" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public read-only access to differentiators" ON public.differentiators;
CREATE POLICY "Allow public read-only access to differentiators" ON public.differentiators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update to site_config" ON public.site_config;
CREATE POLICY "Allow update to site_config" ON public.site_config FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow full access to services" ON public.services;
CREATE POLICY "Allow full access to services" ON public.services FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow full access to differentiators" ON public.differentiators;
CREATE POLICY "Allow full access to differentiators" ON public.differentiators FOR ALL USING (true);

-- 6. PolÃ­ticas de acesso para o Storage (Imagens)
-- Permitir upload pÃºblico (InserÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir upload pÃºblico" ON storage.objects;
CREATE POLICY "Permitir upload pÃºblico"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'site-assets');

-- Permitir update pÃºblico (AtualizaÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir update pÃºblico" ON storage.objects;
CREATE POLICY "Permitir update pÃºblico"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'site-assets');

-- Permitir visualizaÃ§Ã£o pÃºblica (SeleÃ§Ã£o)
DROP POLICY IF EXISTS "Permitir visualizaÃ§Ã£o pÃºblica" ON storage.objects;
CREATE POLICY "Permitir visualizaÃ§Ã£o pÃºblica"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');



