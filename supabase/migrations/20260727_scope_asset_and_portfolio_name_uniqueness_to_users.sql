-- User-entered identifiers only need to be unique within a user's own data.
-- Remove legacy single-column unique constraints/indexes before adding
-- user-scoped equivalents.
do $$
declare
  table_name text;
  unique_column text;
  constraint_name text;
  index_schema text;
  index_name text;
begin
  for table_name, unique_column in
    select *
    from (
      values
        ('accounts', 'name'),
        ('assets', 'name'),
        ('liabilities', 'name'),
        ('portfolios', 'name'),
        ('investments', 'symbol')
    ) as user_owned_identifiers(table_name, unique_column)
  loop
    for constraint_name in
      select constraint_entry.conname
      from pg_constraint as constraint_entry
      join pg_class as table_entry on table_entry.oid = constraint_entry.conrelid
      join pg_namespace as table_schema on table_schema.oid = table_entry.relnamespace
      where table_schema.nspname = 'public'
        and table_entry.relname = table_name
        and constraint_entry.contype = 'u'
        and constraint_entry.conkey = array[
          (
            select attribute_entry.attnum
            from pg_attribute as attribute_entry
            where attribute_entry.attrelid = table_entry.oid
              and attribute_entry.attname = unique_column
              and not attribute_entry.attisdropped
          )
        ]::smallint[]
    loop
      execute format('alter table public.%I drop constraint %I', table_name, constraint_name);
    end loop;

    for index_schema, index_name in
      select index_schema_entry.nspname, index_entry.relname
      from pg_index as index_definition
      join pg_class as index_entry on index_entry.oid = index_definition.indexrelid
      join pg_namespace as index_schema_entry on index_schema_entry.oid = index_entry.relnamespace
      join pg_class as table_entry on table_entry.oid = index_definition.indrelid
      join pg_namespace as table_schema on table_schema.oid = table_entry.relnamespace
      where table_schema.nspname = 'public'
        and table_entry.relname = table_name
        and index_definition.indisunique
        and index_definition.indkey::smallint[] = array[
          (
            select attribute_entry.attnum
            from pg_attribute as attribute_entry
            where attribute_entry.attrelid = table_entry.oid
              and attribute_entry.attname = unique_column
              and not attribute_entry.attisdropped
          )
        ]::smallint[]
        and not exists (
          select 1
          from pg_constraint as constraint_entry
          where constraint_entry.conindid = index_definition.indexrelid
        )
    loop
      execute format('drop index %I.%I', index_schema, index_name);
    end loop;
  end loop;
end $$;

create unique index if not exists accounts_user_id_name_key
  on public.accounts (user_id, name);

create unique index if not exists assets_user_id_name_key
  on public.assets (user_id, name);

create unique index if not exists liabilities_user_id_name_key
  on public.liabilities (user_id, name);

create unique index if not exists portfolios_user_id_name_key
  on public.portfolios (user_id, name);

create unique index if not exists investments_user_id_symbol_key
  on public.investments (user_id, symbol);
