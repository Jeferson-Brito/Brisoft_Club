begin;

create table if not exists clube.penaltyTypes (
  id text primary key,
  data text not null
);

create table if not exists clube.employeeActions (
  id text primary key,
  employee_id text not null references clube.employees(id),
  season_id text not null references clube.seasons(id),
  cycle_id text references clube.cycles(id),
  data text not null
);

create index if not exists employee_actions_employee on clube.employeeActions(employee_id);
create index if not exists employee_actions_season on clube.employeeActions(season_id);

commit;
