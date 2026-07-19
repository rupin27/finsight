begin;

alter table public.transactions
drop constraint if exists transactions_account_id_fkey;

alter table public.transactions
add constraint transactions_account_id_fkey
foreign key (account_id)
references public.accounts(id)
on delete restrict;

commit;