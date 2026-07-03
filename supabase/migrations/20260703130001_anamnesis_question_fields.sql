-- Campos extras para o construtor de anamnese (§5.7).
alter table anamnesis_questions
  add column options  jsonb   not null default '[]'::jsonb,  -- opções p/ escolha
  add column required boolean not null default false;
