-- Demo data for Offline Field Issue Tracker

INSERT INTO reports (
    id,
    category,
    description,
    location,
    priority,
    status,
    reported_at
)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Road',
    'Large pothole near the main entrance',
    'Bole, Addis Ababa',
    'High',
    'Submitted',
    '2026-10-01 09:00:00'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Water',
    'Broken water pipe causing leakage',
    'Kazanchis, Addis Ababa',
    'Medium',
    'In Progress',
    '2026-10-01 10:30:00'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Electricity',
    'Street light is not working',
    'Piassa, Addis Ababa',
    'Low',
    'Resolved',
    '2026-10-01 12:00:00'
)
ON CONFLICT (id) DO NOTHING;


-- Demo history

INSERT INTO report_history (
    id,
    report_id,
    event_type,
    old_status,
    new_status,
    message
)
VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'CREATED',
    NULL,
    'Draft',
    'Demo report created'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'STATUS_CHANGED',
    'Draft',
    'Submitted',
    'Demo report submitted'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'CREATED',
    NULL,
    'Draft',
    'Demo report created'
),
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'STATUS_CHANGED',
    'Draft',
    'Submitted',
    'Demo report submitted'
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '22222222-2222-2222-2222-222222222222',
    'STATUS_CHANGED',
    'Submitted',
    'Assigned',
    'Demo report assigned'
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '22222222-2222-2222-2222-222222222222',
    'STATUS_CHANGED',
    'Assigned',
    'In Progress',
    'Demo work started'
),
(
    '12121212-1212-1212-1212-121212121212',
    '33333333-3333-3333-3333-333333333333',
    'CREATED',
    NULL,
    'Draft',
    'Demo report created'
),
(
    '34343434-3434-3434-3434-343434343434',
    '33333333-3333-3333-3333-333333333333',
    'STATUS_CHANGED',
    'Draft',
    'Submitted',
    'Demo report submitted'
),
(
    '56565656-5656-5656-5656-565656565656',
    '33333333-3333-3333-3333-333333333333',
    'STATUS_CHANGED',
    'Submitted',
    'Assigned',
    'Demo report assigned'
),
(
    '78787878-7878-7878-7878-787878787878',
    '33333333-3333-3333-3333-333333333333',
    'STATUS_CHANGED',
    'Assigned',
    'In Progress',
    'Demo work started'
),
(
    '90909090-9090-9090-9090-909090909090',
    '33333333-3333-3333-3333-333333333333',
    'STATUS_CHANGED',
    'In Progress',
    'Resolved',
    'Demo issue resolved'
)
ON CONFLICT (id) DO NOTHING;