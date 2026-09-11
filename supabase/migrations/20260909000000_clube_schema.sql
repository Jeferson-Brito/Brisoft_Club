begin;

create schema if not exists clube;
revoke all on schema clube from public;

create table if not exists clube.organizations (id text primary key, slug text not null unique, data text not null);
create table if not exists clube.roles (id text primary key, data text not null);
create table if not exists clube.users (id text primary key, tenant_id text not null references clube.organizations(id), email text not null, role_id text not null references clube.roles(id), data text not null, unique(tenant_id,email));
create table if not exists clube.sessions (id text primary key, user_id text not null references clube.users(id), data text not null);
create table if not exists clube.clients (id text primary key, data text not null);
create table if not exists clube.posts (id text primary key, client_id text not null references clube.clients(id), data text not null);
create table if not exists clube.employees (id text primary key, tenant_id text not null references clube.organizations(id), registration text not null, data text not null, unique(tenant_id,registration));
create table if not exists clube.allocations (id text primary key, employee_id text not null references clube.employees(id), post_id text not null references clube.posts(id), data text not null);
create table if not exists clube.seasons (id text primary key, data text not null);
create table if not exists clube.cycles (id text primary key, season_id text not null references clube.seasons(id), data text not null);
create table if not exists clube.participants (id text primary key, cycle_id text not null references clube.cycles(id), employee_id text not null references clube.employees(id), allocation_id text not null references clube.allocations(id), data text not null, unique(cycle_id,employee_id));
create table if not exists clube.evaluations (id text primary key, participant_id text not null references clube.participants(id), evaluator_id text not null references clube.users(id), data text not null, unique(participant_id,evaluator_id));
create table if not exists clube.imports (id text primary key, data text not null);
create table if not exists clube.audit (id text primary key, data text not null);
create table if not exists clube.settings (id text primary key, data text not null);

create index if not exists participants_cycle on clube.participants(cycle_id);
create index if not exists allocations_employee on clube.allocations(employee_id);
create index if not exists evaluations_participant on clube.evaluations(participant_id);

commit;
