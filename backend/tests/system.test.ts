import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import { initDefaultAccounts } from '../src/config/db';
import { Event } from '../src/models/Event';
import { Participant } from '../src/models/Participant';
import { EventRegistration } from '../src/models/EventRegistration';
import { TicketService } from '../src/services/ticketService';
import { hashToken } from '../src/utils/hash';
import { ENV } from '../src/config/env';

let mongoServer: MongoMemoryServer;
let app: any;
let adminToken: string;
let volunteerToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await initDefaultAccounts();
  app = createApp();

  // Obtain admin token with user requested credentials: -admin / -admin@backtobase
  const adminRes = await request(app)
    .post('/api/auth/admin/login')
    .send({ username: '-admin', password: '-admin@backtobase' });
  expect(adminRes.status).toBe(200);
  adminToken = adminRes.body.token;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

describe('BacktoBase Mega Event Core System Tests', () => {
  let event1Id: string;
  let event2Id: string;
  let event1Token: string;
  let event2Token: string;
  let reg1Id: string;

  it('1 & 2. Admin login succeeds with -admin and admin usernames with password -admin@backtobase', async () => {
    expect(adminToken).toBeDefined();

    // Verify admin can also log in as 'admin' with the password
    const altAdminRes = await request(app)
      .post('/api/auth/admin/login')
      .send({ username: 'admin', password: '-admin@backtobase' });
    expect(altAdminRes.status).toBe(200);
    expect(altAdminRes.body.token).toBeDefined();
  });

  it('3. Unauthorized users are blocked from admin protected routes', async () => {
    const unauthRes = await request(app).get('/api/events');
    expect(unauthRes.status).toBe(401);

    const badTokenRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer invalid-token`)
      .send({ name: 'Hacked', description: 'Test', date: new Date() });
    expect(badTokenRes.status).toBe(401);
  });

  it('4. Admin can create multiple events with exactly name, description, date', async () => {
    const res1 = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'BacktoBase Bengaluru 2026',
        description: 'Mega tech and esports championship',
        date: '2026-11-15T10:00:00.000Z',
      });
    expect(res1.status).toBe(201);
    expect(res1.body.event.name).toBe('BacktoBase Bengaluru 2026');
    event1Id = res1.body.event.id;

    const res2 = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'BacktoBase Mumbai 2026',
        description: 'Next gen innovation stage',
        date: '2026-12-05T10:00:00.000Z',
      });
    expect(res2.status).toBe(201);
    event2Id = res2.body.event.id;

    const listRes = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.events.length).toBeGreaterThanOrEqual(2);
  });

  it('5 & 6. Only one event is active globally at a time and activation switches cleanly', async () => {
    // Activate Event 1
    const actRes1 = await request(app)
      .patch(`/api/events/${event1Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetStatus: 'active' });
    expect(actRes1.status).toBe(200);

    const publicRes1 = await request(app).get('/api/public/active-event');
    expect(publicRes1.status).toBe(200);
    expect(publicRes1.body.activeEvent.name).toBe('BacktoBase Bengaluru 2026');

    // Activate Event 2 -> Event 1 must automatically become inactive
    const actRes2 = await request(app)
      .patch(`/api/events/${event2Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetStatus: 'active' });
    expect(actRes2.status).toBe(200);

    const checkE1 = await Event.findById(event1Id);
    const checkE2 = await Event.findById(event2Id);
    expect(checkE1?.status).toBe('inactive');
    expect(checkE2?.status).toBe('active');

    // Switch back to Event 1
    await request(app)
      .patch(`/api/events/${event1Id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetStatus: 'active' });
  });

  it('7 & 8. Participants have only Name and Email & register isolated per event', async () => {
    const addRes = await request(app)
      .post(`/api/participants/event/${event1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alex Mercer',
        email: 'alex@example.com',
      });
    expect(addRes.status).toBe(201);
    reg1Id = addRes.body.registration.id;
    expect(addRes.body.registration.name).toBe('Alex Mercer');
    expect(addRes.body.registration.email).toBe('alex@example.com');

    // Same email can also register for a DIFFERENT event (event2)
    const addRes2 = await request(app)
      .post(`/api/participants/event/${event2Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alex Mercer',
        email: 'alex@example.com',
      });
    expect(addRes2.status).toBe(201);

    // But duplicate registration within the SAME event is rejected
    const dupRes = await request(app)
      .post(`/api/participants/event/${event1Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alex Mercer',
        email: 'alex@example.com',
      });
    expect(dupRes.status).toBe(409);
  });

  it('10. Unique cryptographically secure QR ticket generated', async () => {
    const ticket1 = await TicketService.createTicketDetails(event1Id);
    const ticket2 = await TicketService.createTicketDetails(event1Id);
    expect(ticket1.token).not.toBe(ticket2.token);
    expect(ticket1.tokenHash).not.toBe(ticket2.tokenHash);
    expect(ticket1.qrCodeDataUrl).toContain('data:image/png;base64');
  });

  it('13, 14, 15, 16. Attendance check-in validation, duplicate protection, and wrong event rejection', async () => {
    // Generate known tokens for testing scan
    const t1 = await TicketService.createTicketDetails(event1Id);
    event1Token = t1.token;

    // Create participant 2 in event1 with token1
    const p2 = await Participant.create({ name: 'Sam Jordan', email: 'sam@example.com' });
    await EventRegistration.create({
      eventId: new mongoose.Types.ObjectId(event1Id),
      participantId: p2._id,
      registrationId: t1.registrationId,
      ticketTokenHash: t1.tokenHash,
      ticketVersion: 1,
      attendanceStatus: 'not_checked_in',
    });

    // Create ticket for event2
    const t2 = await TicketService.createTicketDetails(event2Id);
    event2Token = t2.token;
    const p3 = await Participant.create({ name: 'Dana Scully', email: 'dana@example.com' });
    await EventRegistration.create({
      eventId: new mongoose.Types.ObjectId(event2Id),
      participantId: p3._id,
      registrationId: t2.registrationId,
      ticketTokenHash: t2.tokenHash,
      ticketVersion: 1,
      attendanceStatus: 'not_checked_in',
    });

    // Active event is event1. Attempt to scan event2's ticket directly without login -> Rejected!
    const wrongEventRes = await request(app)
      .post('/api/attendance/scan')
      .send({ token: event2Token });
    expect(wrongEventRes.status).toBe(400);
    expect(wrongEventRes.body.status).toBe('WRONG_EVENT');

    // Valid scan for active event1 (direct gate scanning without login requirement)
    const validScanRes = await request(app)
      .post('/api/attendance/scan')
      .send({ token: event1Token });
    expect(validScanRes.status).toBe(200);
    expect(validScanRes.body.status).toBe('SUCCESS');
    expect(validScanRes.body.message).toBe('Attendance Marked Successfully.');
    expect(validScanRes.body.participantName).toBe('Sam Jordan');

    // Repeated scan -> Already Checked In
    const repeatScanRes = await request(app)
      .post('/api/attendance/scan')
      .send({ token: event1Token });
    expect(repeatScanRes.status).toBe(200);
    expect(repeatScanRes.body.status).toBe('ALREADY_CHECKED_IN');
    expect(repeatScanRes.body.message).toBe('Already Checked In.');

    // Unknown or revoked ticket -> Rejected
    const fakeScanRes = await request(app)
      .post('/api/attendance/scan')
      .send({ token: 'completely-bogus-token-12345' });
    expect(fakeScanRes.status).toBe(404);
    expect(fakeScanRes.body.status).toBe('INVALID_TICKET');
  });

  it('17. Revoking/reissuing ticket invalidates previous token', async () => {
    // Reissue reg1
    const reissueRes = await request(app)
      .post(`/api/tickets/reissue/${reg1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reissueRes.status).toBe(200);
    const newToken = reissueRes.body.ticket.token;

    // The new token works, and old hash is replaced
    const regDoc = await EventRegistration.findById(reg1Id);
    expect(regDoc?.ticketVersion).toBe(2);
    expect(regDoc?.ticketTokenHash).toBe(hashToken(newToken));
  });

  it('18. Event statistics calculate accurately', async () => {
    const statsRes = await request(app)
      .get(`/api/events/${event1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(statsRes.status).toBe(200);
    const evt = statsRes.body.event;
    expect(evt.totalParticipants).toBe(2); // Alex and Sam
    expect(evt.totalAttended).toBe(1); // Sam attended
    expect(evt.remainingParticipants).toBe(1);
    expect(evt.attendancePercentage).toBe(50);
  });

  it('19. Main attendance table and CSV export contain EXACTLY Name, Email, Checked In', async () => {
    const attRes = await request(app)
      .get(`/api/attendance/event/${event1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(attRes.status).toBe(200);
    expect(attRes.body.records.length).toBe(2);

    // Each record has strictly name, email, checkedIn
    const record = attRes.body.records[0];
    const keys = Object.keys(record);
    expect(keys).toEqual(['name', 'email', 'checkedIn']);
    expect(['Yes', 'No']).toContain(record.checkedIn);

    // Test CSV export endpoint
    const exportRes = await request(app)
      .get(`/api/attendance/event/${event1Id}/export?format=csv`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-type']).toContain('text/csv');
    expect(exportRes.text).toContain('Name,Email,Checked In');
  });

  it('20. Public active-event endpoint does not leak emails or tokens', async () => {
    const pubRes = await request(app).get('/api/public/active-event');
    expect(pubRes.status).toBe(200);
    const active = pubRes.body.activeEvent;
    expect(active.name).toBe('BacktoBase Bengaluru 2026');
    expect(active.totalParticipants).toBe(2);
    expect(active.totalAttended).toBe(1);
    // Ensure no private participant array or tokens are present
    expect(active.participants).toBeUndefined();
    expect(active.tokens).toBeUndefined();
    expect(active.emails).toBeUndefined();
  });
});
