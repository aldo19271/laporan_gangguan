CREATE TYPE user_role   AS ENUM ('ADMIN','USER');
CREATE TYPE report_status AS ENUM ('MENUNGGU','DIPROSES','SELESAI');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(150) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reporter_name VARCHAR(100) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'MENUNGGU',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- akun admin default (username: admin / password: admin)
INSERT INTO users (email, username, password, role) VALUES
('admin@local','admin',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','ADMIN');