-- Create role_requests table for pending role approvals
CREATE TABLE public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role public.app_role NOT NULL DEFAULT 'editor',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, requested_role, status)
);

-- Enable RLS
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.role_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can create own requests"
ON public.role_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.role_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.role_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.role_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_role_requests_updated_at
BEFORE UPDATE ON public.role_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();