CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    category_title TEXT NOT NULL,
    service_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'declined')),
    created_at TEXT NOT NULL,
    updated_at TEXT,
    confirmed_at TEXT
);

CREATE INDEX IF NOT EXISTS bookings_status_created_at ON bookings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_email_created_at ON bookings(customer_email, created_at DESC);
