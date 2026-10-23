drop policy if exists "Staff can read service applications" on public.service_applications;
create policy "Staff can read service applications" on public.service_applications for select to authenticated using (
 exists (select 1 from public.staff_profiles sp where sp.id=auth.uid() and sp.active=true and (sp.role='admin' or (sp.role='visa_staff' and public.service_applications.application_type='visa'))
);
drop policy if exists "Visa staff can update service applications" on public.service_applications;
create policy "Visa staff can update service applications" on public.service_applications for update to authenticated using (
 exists (select 1 from public.staff_profiles sp where sp.id=auth.uid() and sp.active=true and sp.role='visa_staff') and application_type='visa'
) with check (
 exists (select 1 from public.staff_profiles sp where sp.id=auth.uid() and sp.active=true and sp.role='visa_staff') and application_type='visa'
);