
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: only admins can read user_roles
CREATE POLICY "Admins can read user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create access_keys table
CREATE TABLE public.access_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with keys
CREATE POLICY "Admins can manage access_keys"
ON public.access_keys
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone (anon) can attempt to use a key (select to verify, update to mark used)
CREATE POLICY "Anyone can check a key"
ON public.access_keys
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anyone can use a key"
ON public.access_keys
FOR UPDATE
TO anon
USING (is_used = false)
WITH CHECK (is_used = true);

-- Authenticated users can also check/use keys
CREATE POLICY "Authenticated can check a key"
ON public.access_keys
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can use a key"
ON public.access_keys
FOR UPDATE
TO authenticated
USING (is_used = false)
WITH CHECK (is_used = true);
