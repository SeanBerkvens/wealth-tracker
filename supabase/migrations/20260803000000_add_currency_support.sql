-- All existing monetary records were entered in Canadian dollars.
ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CAD';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CAD';

UPDATE public.investments SET currency = 'CAD' WHERE currency IS NULL;
UPDATE public.transactions SET currency = 'CAD' WHERE currency IS NULL;
