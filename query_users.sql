select to_char((date_trunc('MONTH', created_at) + INTERVAL '1 MONTH')::date, 'dd/mm/yyyy') || ';' || count(*) || ';10;' from users group by (date_trunc('MONTH', created_at) + INTERVAL '1 MONTH')::date order by  (date_trunc('MONTH', created_at) + INTERVAL '1 MONTH')::date;