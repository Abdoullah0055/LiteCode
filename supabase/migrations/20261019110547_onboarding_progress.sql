alter table public.user_settings
  add column onboarding_step text not null default 'objectives'
    check (onboarding_step in ('objectives', 'languages', 'finish', 'complete')),
  add column onboarding_completed_at timestamptz;

-- Accounts that existed before this migration keep their current profile and begin
-- with onboarding marked complete. New accounts receive the incomplete defaults.
update public.user_settings
set onboarding_step = 'complete',
    onboarding_completed_at = coalesce(onboarding_completed_at, now());
