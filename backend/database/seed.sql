USE fire_dispatch;

INSERT INTO roles (name) VALUES ('Admin'), ('Dispatcher'), ('Firefighter');

INSERT INTO stations (name, address, phone) VALUES
  ('Station 1 - Downtown', 'MG Road, Pune', '020-1234567'),
  ('Station 2 - Hadapsar', 'Hadapsar Industrial Area, Pune', '020-7654321');

-- Sample trucks so the dashboard/CRUD screens have something to show
INSERT INTO trucks (code, station_id, type, status) VALUES
  ('TRK-001', 1, 'Pumper', 'Available'),
  ('TRK-002', 1, 'Ladder', 'Available'),
  ('TRK-003', 2, 'Pumper', 'Maintenance');
