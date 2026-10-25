-- ============================================================
-- Kilala Dormitory — MVP 7: birth certificate becomes a
-- student-provided upload (not an admin template).
--
-- Run AFTER mvp6 (idempotent). Adds 'birth_certificate' to the
-- application_documents.doc_type CHECK and makes sure it is NOT
-- part of doc_templates (admin "needs to attach" list).
-- ============================================================

-- ---------- normalize any legacy 'birth_cert' rows ----------
-- Older drafts used birth_cert; the live app + existing uploaded
-- row use birth_certificate. Only update when it won't collide
-- with the (application_id, doc_type) unique constraint.
update public.application_documents d
set doc_type = 'birth_certificate'
where d.doc_type = 'birth_cert'
  and not exists (
    select 1
    from public.application_documents x
    where x.application_id = d.application_id
      and x.doc_type = 'birth_certificate'
  );

delete from public.application_documents
where doc_type = 'birth_cert';

-- ---------- ensure birth certificate is not an admin template ----------
delete from public.doc_templates
where key = 'birth_cert'
   or key = 'birth_certificate'
   or key ilike '%birth%'
   or label ilike '%birth certificate%';

-- Lock doc_templates back down to the 5 real templates, so a birth
-- certificate row cannot be re-added from the admin console.
alter table public.doc_templates
  drop constraint if exists doc_templates_key_check;
alter table public.doc_templates
  add constraint doc_templates_key_check
  check (key in (
    'residency_application',
    'personal_data',
    'residency_agreement',
    'appliance_registration',
    'residency_admission'
  ));

-- ---------- expand application_documents doc_type CHECK to 10 keys ----------
alter table public.application_documents
  drop constraint if exists application_documents_doc_type_check;
alter table public.application_documents
  add constraint application_documents_doc_type_check
  check (doc_type in (
    'residency_application',
    'personal_data',
    'residency_agreement',
    'appliance_registration',
    'residency_admission',
    'cor',
    'student_id_copy',
    'med_lab',
    'med_cert',
    'birth_certificate'
  ));
